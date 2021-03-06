/**
 * Copyright 2013-2020 the original author or authors from the JHipster project.
 *
 * This file is part of the JHipster project, see https://www.jhipster.tech/
 * for more information.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain baseServerFilesa copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const _ = require('lodash');
const faker = require('faker');
const fs = require('fs');
const utils = require('generator-jhipster/generators/utils');
const constants = require('generator-jhipster/generators/generator-constants');
const baseServerFiles = require('generator-jhipster/generators/entity-server/files').serverFiles;

/* Use customized randexp */
const randexp = utils.RandexpWithFaker;

/* Constants use throughout */
const INTERPOLATE_REGEX = constants.INTERPOLATE_REGEX;
const SERVER_MAIN_SRC_DIR = constants.SERVER_MAIN_SRC_DIR;
const SERVER_MAIN_RES_DIR = constants.SERVER_MAIN_RES_DIR;
const CHANGELOG_TEMPLATES_DIR = 'with-new-changelogs';

/*
 * Current faker version is 4.1.0 and was release in 2017
 * It is outdated
 * https://github.com/Marak/faker.js/blob/10bfb9f467b0ac2b8912ffc15690b50ef3244f09/lib/date.js#L73-L96
 * Needed for reproducible builds
 */
const getRecentDate = function(days, refDate) {
    let date = new Date();
    if (refDate !== undefined) {
        date = new Date(Date.parse(refDate));
    }

    const range = {
        min: 1000,
        max: (days || 1) * 24 * 3600 * 1000
    };

    let future = date.getTime();
    future -= faker.random.number(range); // some time from now to N days ago, in milliseconds
    date.setTime(future);

    return date;
};

const getRecentForLiquibase = function(days, changelogDate) {
    let formatedDate;
    if (changelogDate !== undefined) {
        formatedDate = `${changelogDate.substring(0, 4)}-${changelogDate.substring(4, 6)}-${changelogDate.substring(
            6,
            8
        )}T${changelogDate.substring(8, 10)}:${changelogDate.substring(10, 12)}:${changelogDate.substring(12, 14)}+00:00`;
    }
    return getRecentDate(1, formatedDate);
};

/**
 * The default is to use a file path string. It implies use of the template method.
 * For any other config an object { file:.., method:.., template:.. } can be used
 */

const currentServerFiles = {
    ...baseServerFiles,
    dbChangelog: [
        {
            condition: generator => generator.databaseType === 'sql' && !generator.skipDbChangelog && !generator.newChangelog,
            path: SERVER_MAIN_RES_DIR,
            templates: [
                {
                    file: 'config/liquibase/changelog/added_entity.xml',
                    options: { interpolate: INTERPOLATE_REGEX },
                    renameTo: generator => `config/liquibase/changelog/${generator.changelogDate}_added_entity_${generator.entityClass}.xml`
                }
            ]
        },
        {
            condition: generator =>
                generator.databaseType === 'sql' &&
                !generator.skipDbChangelog &&
                (generator.fieldsContainOwnerManyToMany || generator.fieldsContainOwnerOneToOne || generator.fieldsContainManyToOne) &&
                !generator.newChangelog,
            path: SERVER_MAIN_RES_DIR,
            templates: [
                {
                    file: 'config/liquibase/changelog/added_entity_constraints.xml',
                    options: { interpolate: INTERPOLATE_REGEX },
                    renameTo: generator =>
                        `config/liquibase/changelog/${generator.changelogDate}_added_entity_constraints_${generator.entityClass}.xml`
                }
            ]
        },
        {
            condition: generator => generator.databaseType === 'cassandra' && !generator.skipDbChangelog,
            path: SERVER_MAIN_RES_DIR,
            templates: [
                {
                    file: 'config/cql/changelog/added_entity.cql',
                    renameTo: generator => `config/cql/changelog/${generator.changelogDate}_added_entity_${generator.entityClass}.cql`
                }
            ]
        }
    ],
    fakeData: [
        {
            condition: generator =>
                generator.databaseType === 'sql' && !generator.skipFakeData && !generator.skipDbChangelog && !generator.newChangelog,
            path: SERVER_MAIN_RES_DIR,
            templates: [
                {
                    file: 'config/liquibase/fake-data/table.csv',
                    options: {
                        interpolate: INTERPOLATE_REGEX,
                        context: {
                            getRecentForLiquibase,
                            faker,
                            randexp
                        }
                    },
                    renameTo: generator => `config/liquibase/fake-data/${generator.entityTableName}.csv`
                }
            ]
        },
        {
            condition: generator =>
                generator.databaseType === 'sql' &&
                !generator.skipFakeData &&
                !generator.skipDbChangelog &&
                (generator.fieldsContainImageBlob === true || generator.fieldsContainBlob === true),
            path: SERVER_MAIN_RES_DIR,
            templates: [{ file: 'config/liquibase/fake-data/blob/hipster.png', method: 'copy', noEjs: true }]
        },
        {
            condition: generator =>
                generator.databaseType === 'sql' &&
                !generator.skipFakeData &&
                !generator.skipDbChangelog &&
                generator.fieldsContainTextBlob === true,
            path: SERVER_MAIN_RES_DIR,
            templates: [{ file: 'config/liquibase/fake-data/blob/hipster.txt', method: 'copy' }]
        }
    ]
};

const newServerFiles = {
    dbChangelog: [
        ...currentServerFiles.dbChangelog,
        {
            condition: generator => generator.databaseType === 'sql' && !generator.skipDbChangelog && generator.newChangelog,
            path: SERVER_MAIN_RES_DIR,
            templates: [
                {
                    file: 'config/liquibase/changelog/updated_entity.xml',
                    options: { interpolate: INTERPOLATE_REGEX },
                    renameTo: generator =>
                        `config/liquibase/changelog/${generator.newChangelogDate}_updated_entity_${generator.entityClass}.xml`
                }
            ]
        },
        {
            condition: generator =>
                generator.databaseType === 'sql' &&
                !generator.skipDbChangelog &&
                (generator.fieldsContainOwnerManyToMany || generator.fieldsContainOwnerOneToOne || generator.fieldsContainManyToOne) &&
                generator.newChangelog &&
                fs.existsSync(
                    `config/liquibase/changelog/${generator.newChangelogDate}_updated_entity_constraints_${generator.entityClass}.xml`
                ),
            path: SERVER_MAIN_RES_DIR,
            templates: [
                {
                    file: 'config/liquibase/changelog/updated_entity_constraints.xml',
                    options: { interpolate: INTERPOLATE_REGEX },
                    renameTo: generator =>
                        `config/liquibase/changelog/${generator.newChangelogDate}_updated_entity_constraints_${generator.entityClass}.xml`
                }
            ]
        }
    ]
};

function writeFiles() {
    return {
        saveRemoteEntityPath() {
            if (_.isUndefined(this.microservicePath)) {
                return;
            }
            this.copy(
                `${this.microservicePath}/${this.jhipsterConfigDirectory}/${this.entityNameCapitalized}.json`,
                this.destinationPath(`${this.jhipsterConfigDirectory}/${this.entityNameCapitalized}.json`)
            );
        },

        setupReproducibility() {
            if (this.skipServer) return;

            // In order to have consistent results with Faker, restart seed with current entity name hash.
            faker.seed(utils.stringHashCode(this.name.toLowerCase()));
        },

        writeServerFiles() {
            if (this.skipServer) return;

            // write server side files
            this.writeFilesToDisk(currentServerFiles, this, false, this.fetchFromInstalledJHipster('entity-server/templates'));
            this.writeFilesToDisk(newServerFiles, this, false, `${CHANGELOG_TEMPLATES_DIR}`);

            if (this.databaseType === 'sql') {
                if (!this.skipDbChangelog) {
                    if (this.fieldsContainOwnerManyToMany || this.fieldsContainOwnerOneToOne || this.fieldsContainManyToOne) {
                        this.addConstraintsChangelogToLiquibase(`${this.changelogDate}_added_entity_constraints_${this.entityClass}`);
                        if (
                            this.newChangelog &&
                            fs.existsSync(
                                `config/liquibase/changelog/${this.changelogDate}_added_entity_constraints_${this.entityClass}.xml`
                            )
                        ) {
                            this.addConstraintsChangelogToLiquibase(
                                `${this.newChangelogDate}_updated_entity_constraints_${this.entityClass}`
                            );
                        }
                    }
                    this.addChangelogToLiquibase(`${this.changelogDate}_added_entity_${this.entityClass}`);
                    if (this.newChangelog) {
                        this.addChangelogToLiquibase(`${this.newChangelogDate}_updated_entity_${this.entityClass}`);
                    }
                }

                if (['ehcache', 'caffeine', 'infinispan', 'redis'].includes(this.cacheProvider) && this.enableHibernateCache) {
                    this.addEntityToCache(
                        this.asEntity(this.entityClass),
                        this.relationships,
                        this.packageName,
                        this.packageFolder,
                        this.cacheProvider
                    );
                }
            }
        },

        writeEnumFiles() {
            this.fields.forEach(field => {
                if (field.fieldIsEnum === true) {
                    const fieldType = field.fieldType;
                    const enumInfo = utils.buildEnumInfo(field, this.angularAppName, this.packageName, this.clientRootFolder);
                    if (!this.skipServer) {
                        this.template(
                            `${this.fetchFromInstalledJHipster(
                                'entity-server/templates'
                            )}/${SERVER_MAIN_SRC_DIR}package/domain/enumeration/Enum.java.ejs`,
                            `${SERVER_MAIN_SRC_DIR}${this.packageFolder}/domain/enumeration/${fieldType}.java`,
                            this,
                            {},
                            enumInfo
                        );
                    }
                }
            });
        }
    };
}

const serverFiles = {
    ...currentServerFiles,
    ...newServerFiles
};

module.exports = {
    writeFiles,
    serverFiles
};
