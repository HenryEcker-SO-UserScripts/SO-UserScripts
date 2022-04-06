const reduceObjectToSettableType = (obj, initialAcc) => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        acc.set(key, value);
        return acc;
    }, initialAcc);
}

const getFormDataFromObject = (o) => {
    return reduceObjectToSettableType(o, new FormData());
}

const getURLSearchParamsFromObject = (o) => {
    return reduceObjectToSettableType(o, new URLSearchParams());
}