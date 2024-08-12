import Router, { RouterOptions } from '@koa/router'
import { DefaultContext, DefaultState, Middleware } from 'koa'
import compose from 'koa-compose'
import { getActionData } from './action'
import { getControllerData } from './controller'
import { getMiddlewares } from './middleware'
import { getParamData } from './params'

export type ControllerClass<T = any> = new () => T

export interface CreateRouterOptions extends RouterOptions {
    controllers: ControllerClass[]
}

/**
 * 基于控制器类创建路由组件
 * @param options
 */
export function createRouter<StateT = DefaultState, ContextT = DefaultContext>(
    options: CreateRouterOptions
) {
    const { prefix, controllers, ...opts } = options

    //创建根路由组件
    const rootRouter = new Router<StateT, ContextT>({
        prefix,
        ...opts,
    })

    //把每个控制器类创建为一个新的路由子组件
    for (const controllerClass of controllers) {
        const subRouter = createRouterFromController<StateT, ContextT>(controllerClass, opts)
        if (!subRouter) continue
        //把子路由上的前缀改为在父级路由定义
        const subPrefix = subRouter.opts.prefix!
        subRouter.prefix('')
        rootRouter.use(subPrefix, subRouter.middleware(), subRouter.allowedMethods())
    }

    return rootRouter
}

/**
 * 从控制器类创建路由组件
 * @param controllerClass
 * @param options
 */
function createRouterFromController<StateT = DefaultState, ContextT = DefaultContext>(
    controllerClass: ControllerClass,
    options: RouterOptions
): Router<StateT, ContextT> | void {
    const controllerProps = getControllerData(controllerClass)
    if (!controllerProps) return

    const prefix =
        typeof controllerProps.prefix === 'string' && controllerProps.prefix
            ? controllerProps.prefix
            : `/${controllerClass.name}`

    const router = new Router<StateT, ContextT>({
        ...options,
        prefix,
    })

    //路由组件上的中间件
    const controllerMiddlewares = getMiddlewares<StateT, ContextT>(controllerClass)
    if (Array.isArray(controllerMiddlewares) && controllerMiddlewares.length > 0) {
        controllerMiddlewares.forEach((middleware) => router.use(middleware))
    }

    let controllerInstance: any
    const getControllerInstance = () => {
        if (!controllerInstance || controllerProps.reuse === false) {
            controllerInstance = new controllerClass()
        }
        return controllerInstance
    }

    //获取动作方法
    const methodNames = Object.getOwnPropertyNames(controllerClass.prototype)

    for (const methodName of methodNames) {
        const actionMethod: Function = controllerClass.prototype[methodName]
        if (typeof actionMethod !== 'function') continue

        //尝试获取动作方法上的注解
        const actionProps = getActionData(controllerClass.prototype, methodName)
        if (!actionProps) continue

        //获取请求参数注解
        const paramDecorators = getParamData(controllerClass.prototype, methodName)

        //获取所有的路由中间件
        const actionMiddlewares =
            getMiddlewares<StateT, ContextT>(controllerClass.prototype, methodName) ?? []

        //动作方法
        const action: Middleware<StateT, ContextT> = async (ctx, next) => {
            const instance = getControllerInstance()

            //构造请求参数
            const params: any[] = [ctx]
            if (Array.isArray(paramDecorators)) {
                paramDecorators.forEach((getter, index) => {
                    params[index] = getter(ctx)
                })
            }

            const body = await actionMethod.apply(instance, params)
            if (typeof body !== 'undefined' && typeof ctx.body === 'undefined') {
                ctx.body = body
            }
            await next()
        }

        const processor =
            actionMiddlewares.length > 0 ? compose([...actionMiddlewares, action]) : action

        //注册路由
        for (const props of actionProps) {
            let { method, path } = props
            if (typeof path !== 'string' && !(path instanceof RegExp)) {
                path = `/${methodName}`
            }
            if (typeof method === 'string') {
                method = [method]
            }
            if (Array.isArray(method) && method.length > 0) {
                router.register(path, method, processor)
            } else {
                router.all(path, processor)
            }
        }
    }

    return router
}
