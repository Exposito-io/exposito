#!/usr/bin/node

const package = require('../package.json')
const { exec } = require('child-process-promise')
const npm = require('npm')

async function main() {
    console.log('Cleaning repository folders')
    // TODO

    console.log('Cloning repositories')
    await cloneRepos()
    
    console.log('Installing dependencies')

    await npmInstalls()

}


async function cloneRepos() {
    let cloneCommands = getRepos()
                         .map(repo => exec(`git clone ${repo.url} ${repo.name}`)) 
    return Promise.all(cloneCommands)      
}


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