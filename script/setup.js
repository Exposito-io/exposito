#!/usr/bin/node

const package = require('../package.json')
const { exec } = require('child-process-promise')
const npm = require('npm')
const os = require('os')
const fs = require('fs-extra')
const chownr = require('chownr')
const execa = require('execa')

async function main() {

    if (!hasPriviledges()) {
        console.log('Please run the command as root/admin')
        return
    }

    
    console.log('Cleaning repository folders')
    await deleteRepos()

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

async function deleteRepos() {
    const commands = getRepos()
                    .map(async repo => {
                        if (await fs.exists(repo.name))
                            await fs.remove(repo.name)
                    })
    return Promise.all(commands)
}

//npm.commands.link()

async function npmInstalls() {
    const commands = getRepos()
                        .map(repo => npmInstall(repo.name))
    
    return Promise.all(commands)
}

async function npmInstallLinks() {
    const commands = getRepos()
                        .map(repo => execa('npm link', [], { cwd: repo.name }))
    
    return Promise.all(commands)
}



/**
 * Execute a npm install for a repository
 * @param {string} repoName
 */
async function npmInstall(repoName) {
    return new Promise((res,rej) => {
        npm.load({ user: getUser() }, err => {
            if (err)
                rej(err)
            
            npm.commands.install(`./${repoName}`, [], (e,r) => {
                console.log('error: ', e)
                console.log('result: ', r)
                
                chownr.sync(`./${repoName}`, parseInt(getUid()), parseInt(getGid()))
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

function getUser() {
    return process.env.SUDO_USER
}

function getUid() {
    return process.env.SUDO_UID
}

function getGid() {
    return process.env.SUDO_GID
}



main()