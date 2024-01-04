const litVertexShader = await fetch(new URL('./lit.vs', import.meta.url))
    .then(response => response.text());

const litFragmentShader = await fetch(new URL('./lit.fs', import.meta.url))
    .then(response => response.text());

const shadowVertexShader = await fetch(new URL('./shadow.vs', import.meta.url))
    .then(response => response.text());

const shadowFragmentShader = await fetch(new URL('./shadow.fs', import.meta.url))
    .then(response => response.text());

const debugVertexShader = await fetch(new URL('./debug.vs', import.meta.url))
    .then(response => response.text());

const debugFragmentShader = await fetch(new URL('./debug.fs', import.meta.url))
    .then(response => response.text());

export const shaders = {
    renderGeometry: {
        vertex: litVertexShader,
        fragment: litFragmentShader,
    },
    renderShadows: {
        vertex: shadowVertexShader,
        fragment: shadowFragmentShader,
    },
    renderDebug: {
        vertex: debugVertexShader,
        fragment: debugFragmentShader,
    },
};

