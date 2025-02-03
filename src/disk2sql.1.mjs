#!/usr/bin/env node

/** Persist a structure into SQLite and then into GIT... using a function style since I just want each function to be simple */

import * as fs from 'node:fs/promises'
import * as nodePath from 'node:path'
import { performance } from 'node:perf_hooks'
import { parseArgs } from 'node:util'
import assert from 'node:assert'

// 2p
import {chalkpack, register} from 'file://X:/projects/dev2/chalkpack/index.mjs'

// 3p
import envPaths from 'env-paths'
import {makeDirectory} from 'make-dir'
import osName from 'os-name'
import esMain from 'es-main'

import * as sqlite3 from 'sqlite3'
import * as git from 'simple-git'

assert(chalkpack, 'chalkpack not found')
// TODO: (matt): register as soon as possible 
registerChalkpack()

const startTime = performance.now()

// #region config
export let CONFIG = {
    version : '1',
    app_name: 'disk2sql',
    log_prefix: 'DISK2',
    db: {
        extension: 'db'
    },
    schema: {},
    git: {
        branch : {
            name: ''
        },
        remote: {
            name: 'store'
        }
    }
}
CONFIG.db.version = CONFIG.version

// get for the current OS the paths to the users home/location
const _osPaths = envPaths(CONFIG.app_name)

// ==>
    // {data, log, temp, cache }
CONFIG.p = {
    ..._osPaths,
    reportFile: 'disk2sql-node-report.last.json',
    reportPath: ''
}
// the default path to save something to, _if its omitted_
CONFIG.p.defaultTo = CONFIG.p.data + path.sep

// the default path to report the results of execution
CONFIG.p.reportPath = CONFIG.p.data + 'reports' + path.sep + CONFIG.p.reportFile

// stores anything required with current version
CONFIG.schema.metadata =
    `CREATE TABLE IF NOT EXISTS metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE,
        value TEXT
    )`
// the files schema, is the normalised form of the recursive path structure
CONFIG.schema.files =
    `CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT,
        size INTEGER,
        isDirectory INTEGER,
        createdAt INTEGER,
        modifiedAt INTEGER,
        accessedAt INTEGER,
        mode INTEGER,
        uid INTEGER,
        gid INTEGER
    )`

// metadata of the DB... and disk2
CONFIG.schema =
`INSERT INTO metadata (key, value)
VALUES ('version', ?)
ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
[CONFIG.db.version]
// #endregion config

// #region pre-checks
    // create missing dirs
    // check access to the paths... if for some reason something went weird
// #endregion pre-checks

// on exit report the statistics of the execution
process.on('exit', function onExitProcess() {
    const endTime = performance.now()
    const duration = endTime - startTime
    l.h(
        '[process.exit] took: ',
        dayjs(duration).format('mm:ss.SSS'),

        chalk.green(' started: '), chalk.cyan(dayjs(startTime).format('YYYY-MM-DD-HH:mm:ss')),
        chalk.green(' finished: '), chalk.cyan(dayjs(endTime).format('YYYY-MM-DD-HH:mm:ss'))
    )
    process.report.writeReport(`${disk2SqlConfig.paths.disk2sqlHome}/.cache/`)
    l.br()
})

// #region arguments
const argDef = {
    verbose: { type: 'boolean', short: 'v' },
    // TODO: (matt): is this case insensitive?
    force: { type: 'boolean', short: 'F' },
    from: { type: 'string', short: 'fr' },
    to: { type: 'string' },
    force: { type: 'boolean', short: 'F' },
    microsleep: { type: 'int', short: 'ms' },
    help: { type: 'boolean', short: 'h' }
}
const args = () => ({ values: args } = parseArgs(argDef))
// TODO: (matt): what type is returned if it fails?
if (!args) l.e(`Problem parsing args`) && process.exit(1)
// #endregion arguments

// #region flow
const invariant = (cond, msg) => assert(cond, msg)
const try_fn = async fn => {
    try { await fn() }
    catch (e) {/*args.verbose && */log.e(e)}
}
const sleep = async (ms= 1000) => {
    if (ms > 0) await new Promise((resolve) => setTimeout(resolve, ms / 1000))
}
// #endregion flow

// #region message
// -- wrap chalkpack
const today = () => Date.now()
const info = ref => {l.i('Info: ', ref)}
const err = errObject => {l.e('Error: ', errObject.message)}
const fatal = ref => {l.e('Fatal: ', ref) && process.exit(1)}
const warn = () => {l.br() && l.w('') && l.br()}
// #endregion message

// #region path
const _exists = async (path, verbose=1) => (verbose, await fs.access(path))
const full_path = (path, name) => nodePath.join(path, name)
// #endregion path

// #region dir
const dir = async path => await fs.readdir(path, {withFileTypes: true})
const mkdir = async path => await fs.mkdir(path, {recursive: true})
const entries = async() => {
    for await (const e of entries) {

    }
}
// #endregion dir

// #region file
const missing = path => !_exists(path)
const file_metadata = (statObject) => ({
    path:filePath,
    size,
    isDirectory: statObject.isDirectory(),
    createdAt: birthTimeMs,
    modifiedAt: mtimeMs,
    accessedAt: atimeMs,
    mode,
    uid,
    gid
})
const stat = async path => await fs.stat(path)
// #endregion file

// #region db
// TODO: this is not right
const put_metadata = async (stmt, data) => stmt(...data)
// #endregion db

// #region git *  to the repo
// -- git add
const gadd = (git, path) => git.add(path)
    && verbose
    && l.i('DB Update pushed')

// -- git commit
const gcom = (git, msg) => git.commit(msg)
    && verbose
    && l.i('DB Commit')

// -- git push
const gpus = git => git.push(
    CONFIG.git.remote.name,
    CONFIG.git.branch.name
)
    && verbose
    && l.i('DB Pushed')
// #endregion git

// #region 3p
const db = async dbPath => await new sqlite3.Database(dbPath)
const repo = async repoPath => await git(repoPath)
// #endregion 3p

// #region string
const snake_case = str => str.replace(/[^a-zA-Z0-9]/g, '_')
const db_filename = file =>
    snake_case(path.resolve(file))
    .concat('.', CONFIG.db.extension)
// #endregion string

// #region stages
// -- process the start of the script
const start = () => {
    l.head('starting')
    l.info('OS', osName)
}
// -- save the results on success
const save = async () => {
    l.head('saving output')
}
// -- process the end of the script
const end = () => {

}
// #endregion stages

// #region main
async function main() {
    try_fn(exists(l.i('args.from exists:'), args.from))
}
// #endregion main

// -- needs Top-Level async/await
if (esMain()) main()
else {
    // -- TODO: (matt): display a message that the module has be loaded ...
}
