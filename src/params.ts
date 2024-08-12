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

function setParamGetter(
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number,
    getter: ActionParamGetter
) {
    let data: ActionParamGetter[] = Reflect.getOwnMetadata(PARAMS, target, propertyKey)
    if (!data) {
        data = []
        Reflect.defineMetadata(PARAMS, data, target, propertyKey)
    }
    data[parameterIndex] = getter
}

/**
 * 将请求体作为方法参数传入，来自ctx.request.body
 */
export const FromBody = defineParameterDecorator((target, propertyKey, parameterIndex) => {
    // @ts-ignore
    setParamGetter(target, propertyKey, parameterIndex, (ctx) => ctx.request.body)
})

/**
 * 将指定的query参数作为方法参数传入，来自ctx.request.query
 */
export const FromQuery = defineParameterDecorator(
    (target, propertyKey, parameterIndex, name: string) => {
        setParamGetter(target, propertyKey, parameterIndex, (ctx) => ctx.query[name])
    },
    true
)

/**
 * 将指定的url参数作为方法参数传入，来自ctx.request.params
 */
export const FromParam = defineParameterDecorator(
    (target, propertyKey, parameterIndex, name: string) => {
        setParamGetter(
            target,
            propertyKey,
            parameterIndex,
            // @ts-ignore
            (ctx: RouterContext) => ctx.params[name]
        )
    },
    true
)

/**
 * 从ctx.state获取方法参数
 */
export const FromState = defineParameterDecorator(
    (target, propertyKey, parameterIndex, name?: string) => {
        setParamGetter(target, propertyKey, parameterIndex, (ctx) =>
            // @ts-ignore
            typeof name === 'string' ? ctx.state[name] : ctx.state
        )
    },
    false
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
