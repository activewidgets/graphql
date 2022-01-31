/**
 * Copyright (c) ActiveWidgets SARL. All Rights Reserved.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */


function operation(query, op, send){

    let operationName = op.name && op.name.value,
        vars = op.variableDefinitions,
        required = vars.filter(v => v.kind === 'NonNullType').map(v => v.type.name.value);

    if (required.length === 0 && vars.length === 0){
        return () => send(query, null, operationName);
    }

    if (required.length === 0 && vars.length === 1){
        return (variables) => send(query, variables, operationName);
    }

    return (...args) => {
        let variables = Object.assign({}, args[required.length], ...required.map((name, i) => ({[name]: args[i]})));
        send(query, variables, operationName);
    };
}


export function defineOperations(query, send){
        
    if (typeof query == 'string'){
        return () => send(query);
    }

    let defs = query.definitions.filter(def => def.operation);

    if (defs.length == 1) {
        return operation(query, defs[0], send);
    }

    let ops = {};
    defs.forEach(op => {ops[op.name.value] = operation(query, op, send)});
    return ops;
}    