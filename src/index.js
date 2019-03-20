import Loading from './components/Loading'

export { default as Install } from './HOC/Install'
export { default as Push } from './HOC/Push'
export { default as Pull } from './HOC/Pull'
export { default as Model } from './HOC/Model'
export { default as Request } from './HOC/Request'
export { default as withEnhance } from './HOC/withEnhance'
export { configureStore as init } from './configureStore'
export { connect } from 'react-redux'
export { bindActionCreators } from 'redux'

export { LOADING_MODEL_NAME } from './const'

export const component = {
    Loading,
}

export { default as Loading } from './components/Loading'
export { default as asyncComponent } from './AsyncComponent'

// 新组织
export { default as tools } from './tools'

export { default as hooks } from './hooks'
