/**
 * Copyright (c) ActiveWidgets SARL. All Rights Reserved.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {print} from 'graphql';
import {parseGraphql} from './parse.js';
import {defineOperations} from './operations.js';

const defaultHeaders = {
    'Accept': 'application/json', 
    'Content-Type': 'application/json'
};

const {assign} = Object;

function plugin({api, callbacks}, serviceURL, fetchConfig){


    function sendRequest(data){
        let headers = assign({}, defaultHeaders, fetchConfig && fetchConfig.headers),
            config = assign({}, fetchConfig, {method: 'POST', headers, body: JSON.stringify(data)});
        return callbacks.request(serviceURL, config);
    }


    function processResponse(res){
        let throwErr = errors => {throw new Error(errors.map(e => e.message).join('\n'))};
        return callbacks.response(res).then(({data, errors}) => errors ? throwErr(errors) : convertData(data));
    }


    function convertParams(params){

        if (typeof params !== 'object'){
            return params;
        }

        let obj = assign(...callbacks.params.map(fn => fn(params))),
            result = {};

        Object.keys(obj).forEach(i => {
            if (typeof obj[i] != 'undefined'){
                result[i] = obj[i];
            }
        })
    
        return result;
    }


    function convertData(data){

        while (data && typeof data._from == 'object'){
            data = data._from;
        }

        if (data && typeof data._return != 'undefined'){
            data = data._return;
        }
        else {
            return null; // ???
        }

        if (callbacks.data){
            let i, result, len = callbacks.data.length;
            for(i=0; i<len; i++){
                result = callbacks.data[i](data);
                if (typeof result != 'undefined'){
                    return result;
                }
            }
        }

        return data;
    }


    function send(query, variables, operationName){

        if (typeof query == 'object'){
            query = query.source || print(query);
        }

        return Promise.resolve({query, variables, operationName}).then(sendRequest).then(processResponse);
    }


    function simpleQuery(name){

        function fieldName(col){
            let fld = String(col.field).split('.');
            return fld.length > 1 ? fld[0] + '{' + fld[1] + '}' : fld[0];
        }

        return function(){
            let fields = api.columns.getNext().map(fieldName).join(' '),
                query = `{items:${name}{${fields}}}`;
            return send(query);
        }
    }


    callbacks.inputs.unshift(input => {
        if (typeof input == 'string' && /^\w+$/.test(input)){
            return simpleQuery(input);
        }
        if (typeof input == 'string'){
            return defineOperations(parseGraphql(input), send, convertParams);
        }
        if (typeof input == 'object' && input && input.kind === 'Document'){
            return defineOperations(input, send, convertParams);
        }
    });
}

export function graphql(serviceURL, fetchConfig){
    return comp => plugin(comp, serviceURL, fetchConfig);
}