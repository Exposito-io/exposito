#!/usr/bin/node

const package = require('../package.json')
const { exec } = require('child-process-promise')
const npm = require('npm')
const os = require('os')

async function main() {

    if (!hasPriviledges()) {
        console.log('Please run the command as root/admin')
        return
    }

    
    console.log('Cleaning repository folders')
    // TODO

    console.log('Cloning repositories')
    await cloneRepos()
    
    console.log('Installing dependencies')

    await npmInstalls()
    //console.log('SUDO_USER: ', process.env.SUDO_USER)

}


function hasPriviledges() {
    if (os.platform() === 'linux' && isRoot())
        return true

    if (os.platform() === 'darwin' && isRoot())
        return true

    if (os.platform() === 'win32')
        return true

    return false
}

function isRoot() {
    return process.getuid && process.getuid() === 0
}

async function cloneRepos() {
    let cloneCommands = getRepos()
                         .map(repo => exec(`git clone ${repo.url} ${repo.name}`)) 
    return Promise.all(cloneCommands)      
}

//npm.commands.link()

async function npmInstalls() {
    let commands = getRepos()
                        .map(repo => npmInstall(repo.name))
    
    return Promise.name(commands)
}

/**
 * Execute a npm install for a repository
 * @param {string} repoName
 */
async function npmInstall(repoName) {
    return new Promise((res,rej) => {
        npm.load({}, err => {
            if (err)
                rej(err)
            
            npm.commands.install(`./${repoName}`, [], (e,r) => {
                console.log('error: ', e)
                console.log('result: ', r)
                res()
            })
        })
    })
}


/**
 * @returns { {name:string, url:string}[] }
 */
function getRepos() {
    return Object.entries(package.repositories)
    .map(repo => ({ name: repo[0], url: repo[1] }))
}



main()