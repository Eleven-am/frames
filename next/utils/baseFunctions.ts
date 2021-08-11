export async function pFetch(data: any, location: string) {
    return await fetch(location, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }).then(response => response.json())
        .then(data => {
            return data;
        })
        .catch(reason => console.log(reason));
}

export const capitalize = (s: string) => {
    return s.charAt(0).toUpperCase() + s.slice(1)
}

export async function sFetch<S>(location: string, ac?: AbortController){
    return new Promise<S|null>(resolve => {
        fetch(location, {signal: ac?.signal})
            .then(data => data.json())
            .then(response => resolve(response))
            .catch(err => {
                if (err.name && err.name !== 'AbortError')
                    resolve(null)
            });
    })
}