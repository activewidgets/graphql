/**
 * Copyright (c) ActiveWidgets SARL. All Rights Reserved.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */


let parseName = value => ({
    kind: 'Name', 
    value
});


let parseType = (type, required) => (required ? {
    kind: 'NonNullType', 
    type: parseType(type)
} : {
    kind: 'NamedType',
    name: parseName(type)
});


let parseVariable = (name, type, required) => ({
    kind: 'VariableDefinition', 
    variable: {
        kind: 'Variable',
        name: parseName(name)
    },
    type: parseType(type, required)
});


let parseDefinition = source => {

    let match = /^fragment\s+(\w+)\s+on\s/.exec(source);

    if (match){
        return {
            kind: 'FragmentDefinition', 
            name: parseName(match[1]) 
        };
    }

    match = /^(query|mutation|subscription)\s+(\w+)\s*(\([^)]+\))?/.exec(source);

    if (!match){
        return source;
    }

    /* eslint no-unused-vars: ["error", { "varsIgnorePattern": "ignore" }] */
    let [ignore, operation, name, vars] = match,
        variableDefinitions = [];

    String(vars).replace(/\$\s*(\w+)\s*:\s*(\w+)\s*(!*)/g, (src, name, type, required) => {
        variableDefinitions.push(parseVariable(name, type, required));
    });

    return {
        kind: 'OperationDefinition', 
        operation, 
        name: parseName(name), 
        variableDefinitions 
    };
};


export function parseGraphql(source){

    let clean = source.replace(/#[^\n\r]*/g, ''),
        parts = clean.split(/\s*\b(?=query\b|mutation\b|subscription\b|fragment\b)/);

    if (parts[0] === ''){
        parts.shift();
    }

    let i, item, definitions = [];

    for (i=parts.length-1; i>=0; i--){
        
        item = parseDefinition(parts[i]);
        
        if (typeof item == 'object'){
            definitions.unshift(item);
        }
        else if (i){
            parts[i-1] += ' ' + item;
        }
        else {
            return source; // cannot parse
        }
    }

    return {kind: "Document", definitions, source};
}