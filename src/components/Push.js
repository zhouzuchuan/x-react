/**
 * 传递context
 * */

import React from 'react';
import Install from './Install';
import { isArray, isFunction, isString } from '../utils';
import pick from 'lodash.pick';

export default (id, fn = []) => WrappedComponent => {
    class Push extends React.Component {
        render() {
            const { __CONTEXT__, ...props } = this.props;
            const ContextStore = __CONTEXT__[id];

            if (!ContextStore) {
                console.warn(
                    '组件${WrappedComponent.displayName} Push 的 仓库id 不存在，请在 init 初始化中注册 warehouse！'
                );
                return <WrappedComponent {...props} />;
            }
            const dealValue = isFunction(fn)
                ? fn(props)
                : isArray(fn) || isString(fn)
                    ? pick(props, fn)
                    : {};
            return (
                <ContextStore.Provider value={dealValue}>
                    <WrappedComponent {...props} />
                </ContextStore.Provider>
            );
        }
    }
    return Install([], [id])(Push);
};