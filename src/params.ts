import { RouterContext } from '@koa/router'
import { defineParameterDecorator } from 'decorator-helper'
import { DefaultContext, DefaultState, ParameterizedContext } from 'koa'
import 'reflect-metadata'

const PARAMS = Symbol()

export type ActionParamGetter = <
    StateT = DefaultState,
    ContextT = DefaultContext,
    ResponseBodyT = any
>(
    ctx: ParameterizedContext<StateT, ContextT, ResponseBodyT>
) => any

export type ActionParamData = ActionParamGetter[]

/**
 * 将请求体作为方法参数传入，来自ctx.request.body
 */
export const FromBody = defineParameterDecorator((target, propertyKey, parameterIndex) => {
    let data: ActionParamGetter[] = Reflect.getOwnMetadata(PARAMS, target, propertyKey)
    if (!data) {
        data = []
        Reflect.defineMetadata(PARAMS, data, target, propertyKey)
    }
    // @ts-ignore
    data[parameterIndex] = (ctx) => ctx.request.body
})

/**
 * 将指定的query参数作为方法参数传入，来自ctx.request.query
 */
export const FromQuery = defineParameterDecorator(
    (target, propertyKey, parameterIndex, name: string) => {
        let data: ActionParamGetter[] = Reflect.getOwnMetadata(PARAMS, target, propertyKey)
        if (!data) {
            data = []
            Reflect.defineMetadata(PARAMS, data, target, propertyKey)
        }
        data[parameterIndex] = (ctx) => ctx.query[name]
    },
    true
)

/**
 * 将指定的url参数作为方法参数传入，来自ctx.request.params
 */
export const FromParam = defineParameterDecorator(
    (target, propertyKey, parameterIndex, name: string) => {
        let data: ActionParamGetter[] = Reflect.getOwnMetadata(PARAMS, target, propertyKey)
        if (!data) {
            data = []
            Reflect.defineMetadata(PARAMS, data, target, propertyKey)
        }
        // @ts-ignore
        data[parameterIndex] = (ctx: RouterContext) => ctx.params[name]
    },
    true
)

/**
 * 获取动作方法参数装饰器
 * @param target
 * @param propertyKey
 */
export function getParamData(
    target: Object,
    propertyKey: string | symbol
): ActionParamGetter[] | undefined {
    return Reflect.getOwnMetadata(PARAMS, target, propertyKey)
}
