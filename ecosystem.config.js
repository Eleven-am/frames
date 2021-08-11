module.exports = {
    apps: [{
        name: "frames",
        script: "node_modules/next/dist/bin/next",
        args: "start",
        time: true,
        instances: "max",
        exec_mode: "cluster",
        max_memory_restart: '200M'
    }]
}
