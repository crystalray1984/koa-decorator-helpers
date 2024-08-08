import { defineMethodDecorator } from 'decorator-helper'
import 'reflect-metadata'

/**
 * 快捷路由动作属性
 */
export interface ActionShortcutProps {
    /**
     * 请求的地址
     */
    path?: string | RegExp
}

/**
 * 路由动作属性
 */
export interface ActionProps extends ActionShortcutProps {
    /**
     * 请求的方法
     */
    method?: string | string[]
}

const ACTION = Symbol()

/**
 * 创建一个指定了请求方法的路由动作装饰器
 * @param method
 */
function createActionDecorator(method?: string | string[]) {
    return defineMethodDecorator<[ActionProps | string | RegExp]>(
        (target, propertyKey, _, arg1) => {
            //尝试获取类方法上的路由动作属性数组
            let actionProps = getActionData(target, propertyKey)
            if (!Array.isArray(actionProps)) {
                actionProps = []
                Reflect.defineMetadata(ACTION, actionProps, target, propertyKey)
            }

            let props: ActionProps
            if (typeof arg1 === 'string' || arg1 instanceof RegExp) {
                props = { path: arg1, method }
            } else if (typeof arg1 === 'object' && arg1) {
                props = arg1
            } else {
                props = { method }
            }

            actionProps.push(props)
        },
        false
    )
}

/**
 * 标准的路由动作方法
 */
export const Action = createActionDecorator()
export const Get = createActionDecorator('GET')
export const Post = createActionDecorator('POST')
export const Put = createActionDecorator('PUT')
export const Delete = createActionDecorator('DELETE')
export const Head = createActionDecorator('HEAD')

/**
 * 获取动作方法配置
 * @param target
 * @param propertyKey
 */
export function getActionData(target: Object, propertyKey: string | symbol): ActionProps[] | void {
    return Reflect.getOwnMetadata(ACTION, target, propertyKey)
}
