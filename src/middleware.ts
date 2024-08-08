import { DecoratingTarget, defineCompatibleDecorator } from 'decorator-helper'
import {
    DefaultContext,
    DefaultState,
    Middleware as KoaMiddleware,
    Next,
    ParameterizedContext,
} from 'koa'
import 'reflect-metadata'

const MIDDLEWARES = Symbol()

/**
 * 操作中间件的数据写入
 */
function setMiddlewares<StateT = DefaultState, ContextT = DefaultContext, ResponseBodyT = any>(
    target: DecoratingTarget,
    middlewares: KoaMiddleware<StateT, ContextT, ResponseBodyT>[]
) {
    //如果没有设定任何中间件就直接出去了
    if (middlewares.length === 0) return

    if (target.type === 'class') {
        //定义控制器中间件
        let exists: KoaMiddleware<StateT, ContextT, ResponseBodyT>[] = Reflect.getOwnMetadata(
            MIDDLEWARES,
            target.target
        )
        if (!Array.isArray(exists)) {
            exists = []
            Reflect.defineMetadata(MIDDLEWARES, exists, target.target)
        }
        exists.push(...middlewares)
    } else if (target.type === 'method') {
        //定义动作中间件
        let exists: KoaMiddleware<StateT, ContextT, ResponseBodyT>[] = Reflect.getOwnMetadata(
            MIDDLEWARES,
            target.target,
            target.propertyKey
        )
        if (!Array.isArray(exists)) {
            exists = []
            Reflect.defineMetadata(MIDDLEWARES, exists, target.target, target.propertyKey)
        }
        exists.push(...middlewares)
    }
}

export const Middlewares = defineCompatibleDecorator<
    [KoaMiddleware[]] | [KoaMiddleware, ...KoaMiddleware[]]
>((target, arg0, ...args: KoaMiddleware[]) => {
    let middlewares: KoaMiddleware[] = []
    if (Array.isArray(arg0)) {
        middlewares = arg0
    } else {
        middlewares = [arg0, ...args]
    }

    middlewares = middlewares.filter((t) => typeof t === 'function')

    setMiddlewares(target, middlewares)
}, true)

/**
 * 被装饰的中间件
 */
export type DecoratedMiddleware<ContextT, ArgsT extends any[] = []> = (
    context: ContextT,
    next: Next,
    ...args: ArgsT
) => any

/**
 * 将一个中间件包装成一个装饰器
 */
export function createMiddlewareDecorator<
    ArgsT extends any[] = [],
    StateT = DefaultState,
    ContextT = DefaultContext,
    ResponseBodyT = any
>(middleware: DecoratedMiddleware<ParameterizedContext<StateT, ContextT, ResponseBodyT>, ArgsT>) {
    return defineCompatibleDecorator<ArgsT>((target, ...args) => {
        //包装一下中间件方法，可以接受更多的参数
        const decorated: KoaMiddleware<StateT, ContextT, ResponseBodyT> = (ctx, next) =>
            middleware(ctx, next, ...args)

        setMiddlewares(target, [decorated])
    }, false)
}

/**
 * 读取中间件配置信息
 */
export function getMiddlewares<
    StateT = DefaultState,
    ContextT = DefaultContext,
    ResponseBodyT = any
>(
    target: Object,
    propertyKey?: string | symbol
): KoaMiddleware<StateT, ContextT, ResponseBodyT>[] | void {
    if (typeof propertyKey === 'string' || typeof propertyKey === 'symbol') {
        return Reflect.getOwnMetadata(MIDDLEWARES, target, propertyKey)
    } else {
        return Reflect.getOwnMetadata(MIDDLEWARES, target)
    }
}
