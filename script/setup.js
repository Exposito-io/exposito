#!/usr/bin/node

const package = require('../package.json')
const npm = require('npm')
const os = require('os')
const fs = require('fs-extra')
const execa = require('execa')
const { performance } = require('perf_hooks')
const _ = require('lodash')

async function main() {

    try {
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

        console.log('Linking repositories')
        await npmInstallLinks()
        await linkRepos()


        console.log('Done :)')
    } catch(e) {
        console.log('Error: ', e)
    }
    //console.log('SUDO_USER: ', process.env.SUDO_USER)

}


function hasPriviledges() {
    if (isLinux() && isRoot())
        return true

    if (isMac() && isRoot())
        return true

    if (isWindows() && 'win32')
        return true

    return false
}

async function cloneRepos() {
    let cloneCommands = getRepos()
                         .map(repo => execAsUser('git', ['clone', repo.url, repo.name])) 
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


async function npmInstalls() {

    const commands = getRepos()
        .map(repo => execAsUser('npm', ['install'], { cwd: `./${repo.name}` }))

    return Promise.all(commands)    

}


/**
 * Replace exposito npm modules with symlinks to the
 * local repositories
 */
async function linkRepos() {
    const commands = getRepos()
        .map(repo => repo.links.map(link => execAsUser('npm', ['link', link], { cwd: `./${repo.name}`})))
        
    
    return Promise.all(commands)
}

/**
 * Creates a symlink in the global folder
 * for each repo
 */
async function npmInstallLinks() {
    const commands = getRepos()
                        .map(repo => execa('npm', ['link'], { cwd: `./${repo.name}` }))
    
    return Promise.all(commands)
}

async function execAsUser(command, args, opts) {
    if (isWindows())
        return execa(command, args, opts)
    else {
        args.unshift('-u', getUser(), command)
        return execa('sudo', args, opts)
    }
}



function isRoot() {
    return process.getuid && process.getuid() === 0
}

function isLinux() {
    return os.platform() === 'linux'
}

function isWindows() {
    return os.platform() === 'win32'
}

function isMac() {    
    return os.platform() === 'darwin' 
}


/**
 * @returns { {name:string, url:string, links:[]}[] }
 */
function getRepos() {
    return Object.entries(package.repositories)
    .map(repo => ({ name: repo[0], ...repo[1] }))
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

async function wait(time) {
    return new Promise(res => setTimeout(res, time))
}

main()