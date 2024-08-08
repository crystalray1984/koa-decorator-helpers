import { defineClassDecorator } from 'decorator-helper'
import 'reflect-metadata'

/**
 * 路由控制器配置项
 */
export interface ControllerProps {
    /**
     * 路径前缀，如果不指定则自动使用`/控制器类名`
     */
    prefix?: string
    /**
     * 是否重用控制器实例，默认为true
     */
    reuse?: boolean
}

/**
 * 表示为控制器的属性键
 */
const CONTROLLER = Symbol()

export const Controller = defineClassDecorator<[ControllerProps]>(
    /**
     *
     * @param constructor 类构造方法
     * @param props 传递过来的控制配置项
     */
    (constructor, props) => {
        //覆盖类上的控制器属性
        Reflect.defineMetadata(CONTROLLER, props ?? {}, constructor)
    },
    false
)

/**
 * 读取类上定义的控制器属性
 * @param controllerClass
 */
export function getControllerData(controllerClass: Function): ControllerProps | void {
    return Reflect.getOwnMetadata(CONTROLLER, controllerClass)
}
