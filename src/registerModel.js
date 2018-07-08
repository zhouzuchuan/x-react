import { combineReducers } from 'redux';
import { isUndefined } from './utils';
import RE from './store';
import { fork, takeLatest, all, put, select, call } from 'redux-saga/effects';

export function createReducer(initialState, handlers) {
    return function reducer(state = initialState, action) {
        if (handlers.hasOwnProperty(action.type)) {
            return handlers[action.type](state, action);
        } else {
            return state;
        }
    };
}

const addNameSpace = (obj = {}, namespace) =>
    Object.entries(obj).reduce((r, [n, m]) => ({ ...r, [`${namespace}/${n}`]: m }), {});

export function injectAsyncReducers(asyncReducers, initialState) {
    let flag = false;

    if (asyncReducers) {
        for (let [n, m] of Object.entries(asyncReducers)) {
            if (Object.prototype.hasOwnProperty.call(asyncReducers, n)) {
                if (RE && !(RE.asyncReducers || {})[n]) {
                    RE.asyncReducers[n] = createReducer(initialState[n] || {}, m);
                    flag = true;
                }
            }
        }
        flag && RE.__store__.replaceReducer(combineReducers(RE.asyncReducers));
    }
}

export function injectAsyncSagas(sagas, sagaMiddleware) {
    if (sagas) {
        for (let [n, m] of Object.entries(sagas)) {
            if (Object.prototype.hasOwnProperty.call(sagas, n)) {
                if (RE && !(RE.asyncSagas || {})[n]) {
                    RE.asyncSagas[n] = m;
                    sagaMiddleware.run(m);
                }
            }
        }
    }
}

export default function registerModel(sagaMiddleware, models) {
    console.log();
    const deal = (Array.isArray(models) ? models : [models])
        .filter(({ namespace, effects, reducer }) => {
            if (isUndefined(namespace)) {
                console.warn(`namespace 必填并且唯一， 该model未载入，请检查！`);
                return false;
            }

            // if (RE._models.includes(namespace)) {
            //     console.warn(`namespace 必须唯一， ${namespace} 已经被使用，该model未载入，请检查！`);
            //     return false;
            // }

            RE._models.push(namespace);
            return true;
        })
        .reduce((r, { namespace, effects = {}, reducers = {}, state = {} }) => {
            const dealSagas = addNameSpace(effects, namespace);
            const dealReducers = addNameSpace(reducers, namespace);

            RE._effects = {
                ...RE._effects,
                ...dealSagas
            };
            return {
                state: {
                    ...(r.state || {}),
                    [namespace]: state
                },
                sagas: {
                    ...(r.sagas || {}),
                    [namespace]: dealSagas
                },
                reducers: {
                    ...(r.reducers || {}),
                    [namespace]: dealReducers
                }
            };
        }, {});

    if (!deal.sagas) return;

    injectAsyncReducers(deal.reducers, deal.state);
    injectAsyncSagas(
        Object.entries(deal.sagas).reduce((r, [name, fns]) => {
            return {
                ...r,

                // [name]: function*() {
                //     yield all([
                //         fork(function*() {
                //             yield Object.entries(fns).map(([n, m]) => {
                //                 return takeLatest(n, m);
                //             });
                //         })
                //     ]);
                // }
                [name]: function*() {
                    yield all([
                        fork(function*() {
                            yield all([
                                ...Object.entries(fns).map(([n, m]) => {
                                    return takeLatest(n, function*(action) {
                                        yield all([
                                            fork(
                                                m.bind(null, action, {
                                                    put,
                                                    select,
                                                    call
                                                })
                                            )
                                        ]);
                                    });
                                })
                            ]);
                        })
                    ]);
                }
            };
        }, {}),
        sagaMiddleware
    );
}
