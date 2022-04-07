/**
 * Copyright (c) ActiveWidgets SARL. All Rights Reserved.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */


function operation(query, op, send, convert){

    let operationName = op.name && op.name.value,
        vars = op.variableDefinitions,
        required = vars.filter(v => v.type.kind === 'NonNullType').map(v => v.variable.name.value);

    if (required.length === 0 && vars.length === 0){
        return () => send(query, null, operationName);
    }

    if (required.length === 0 && vars.length === 1){
        return (variables) => send(query, convert(variables), operationName);
    }

    return (first, ...rest) => {
        let args = [first, ...rest],
            variables = Object.assign({}, convert(args[required.length]), ...required.map((name, i) => ({[name]: args[i]})));
        return send(query, variables, operationName);
    };
}


export function defineOperations(query, send, convert){
        
    if (typeof query == 'string'){
        return () => send(query);
    }

    let defs = query.definitions.filter(def => def.operation);

    if (defs.length == 1) {
        return operation(query, defs[0], send, convert);
    }

    let ops = {};
    defs.forEach(op => {ops[op.name.value] = operation(query, op, send, convert)});
    return ops;
}    