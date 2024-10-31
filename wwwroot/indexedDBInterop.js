let db;

//let winnerIdsStorageService;

//function setWinnerIdsStorageService(serviceInstance) {
//    winnerIdsStorageService = serviceInstance;
//}


window.indexedDBInterop = {
    createEntryDb: function (dbName, storeName) {
        return new Promise((resolve, reject) => {
            let request = indexedDB.open(dbName, 1);

            request.onupgradeneeded = function (event) {
                let db = event.target.result;
                /*db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });*/
                if (!db.objectStoreNames.contains("RaffleEntry")) {
                    db.createObjectStore("RaffleEntry", { keyPath: 'id', autoIncrement: true });
                }
            };

            request.onsuccess = function () {
                resolve(true);
            };

            request.onerror = function (event) {
                reject(event.target.error);
            };
        });
    },

    createPrizeDb: function (dbName, storeName) {
        return new Promise((resolve, reject) => {
            let request = indexedDB.open(dbName, 1);

            request.onupgradeneeded = function (event) {
                let db = event.target.result;
                /*db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });*/

                if (!db.objectStoreNames.contains("Prize")) {
                    db.createObjectStore("Prize", { keyPath: 'id', autoIncrement: true });
                }
            };

            request.onsuccess = function () {
                resolve(true);
            };

            request.onerror = function (event) {
                reject(event.target.error);
            };
        });
    },

    createGalleryDb: function (dbName, storeName) {
        return new Promise((resolve, reject) => {
            let request = indexedDB.open(dbName, 1);

            request.onupgradeneeded = function (event) {
                let db = event.target.result;
                /*db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });*/

                //if (!db.objectStoreNames.contains("Gallery")) {
                //    db.createObjectStore("Gallery", { keyPath: 'id', autoIncrement: true });
                //}
                if (!db.objectStoreNames.contains("Gallery")) {
                    const store = db.createObjectStore("Gallery", {
                        keyPath: "id",
                        autoIncrement: true
                    });
                    // Add indexes if needed
                    /*store.createIndex("fileName", "fileName", { unique: true });*/
                }
            };

            request.onsuccess = function () {
                resolve(true);
            };

            request.onerror = function (event) {
                reject(event.target.error);
            };
        });
    },

   

    addItem: function (dbName, storeName, item) {
        return new Promise((resolve, reject) => {
            let request = indexedDB.open(dbName);

            request.onsuccess = function (event) {
                let db = event.target.result;
                let transaction = db.transaction(storeName, "readwrite");
                let store = transaction.objectStore(storeName);
                store.add(item);

                transaction.oncomplete = function () {
                    resolve(true);
                };

                transaction.onerror = function (event) {
                    reject(event.target.error);
                };
            };

            request.onerror = function (event) {
                reject(event.target.error);
            };
        });
    },

    //non-promise.all
    //addItemsInBatch: function (dbName, storeName, items) {
    //    return new Promise((resolve, reject) => {
    //        let request = indexedDB.open(dbName);
    //        request.onsuccess = function (event) {
    //            let db = event.target.result;
    //            let transaction = db.transaction(storeName, "readwrite");
    //            let store = transaction.objectStore(storeName);
    //            for (const item of items) {
    //                store.add(item);
    //            }
    //            transaction.oncomplete = function () {
    //                resolve(true);
    //            };
    //            transaction.onerror = function (event) {
    //                reject(event.target.error);
    //            };
    //        };
    //        request.onerror = function (event) {
    //            reject(event.target.error);
    //        };
    //    });
    //},

    //promise.all (working well)
    //addItemsInBatch: function (dbName, storeName, items) {
    //    return new Promise((resolve, reject) => {
    //        let request = indexedDB.open(dbName);
    //        request.onsuccess = async function (event) {
    //            let db = event.target.result;
    //            let transaction = db.transaction(storeName, "readwrite");
    //            let store = transaction.objectStore(storeName);
    //            let promises = items.map(item => {
    //                return new Promise((resolve, reject) => {
    //                    let request = store.add(item);
    //                    request.onsuccess = resolve;
    //                    request.onerror = reject;
    //                });
    //            });
    //            try {
    //                await Promise.all(promises);
    //                resolve(true);
    //            } catch (error) {
    //                reject(error);
    //            }
    //        };
    //        request.onerror = function (event) {
    //            reject(event.target.error);
    //        };
    //    });
    //},

    //promise.all + batch
    addItemsInBatch: function (dbName, storeName, items, batchSize = 1000) {
        return new Promise(async (resolve, reject) => {
            let request = indexedDB.open(dbName);
            request.onerror = function (event) {
                reject(event.target.error);
            };
            request.onsuccess = async function (event) {
                let db = event.target.result;
                let batchPromises = [];

                // Create batches
                for (let i = 0; i < items.length; i += batchSize) {
                    let batch = items.slice(i, i + batchSize);

                    // Handle each batch in a separate transaction
                    batchPromises.push(new Promise((resolveBatch, rejectBatch) => {
                        let transaction = db.transaction(storeName, "readwrite");
                        let store = transaction.objectStore(storeName);
                        let batchOperations = batch.map(item => new Promise((resolveOp, rejectOp) => {
                            let request = store.add(item);
                            request.onsuccess = resolveOp;
                            request.onerror = rejectOp;
                        }));
                        Promise.all(batchOperations).then(() => resolveBatch()).catch(rejectBatch);
                    }));
                }
                // Resolve all batches
                Promise.all(batchPromises).then(() => resolve(true)).catch(error => {
                    console.error("Error in processing batches", error);
                    reject(error);
                });
            };
        });
    },


    getItem: function (dbName, storeName, id) {
        return new Promise((resolve, reject) => {
            let request = indexedDB.open(dbName);
            request.onsuccess = function (event) {
                let db = event.target.result;
                let transaction = db.transaction(storeName, "readonly");
                let store = transaction.objectStore(storeName);
                let getRequest = store.get(id);
                getRequest.onsuccess = function (event) {
                    resolve(event.target.result);
                };
                getRequest.onerror = function (event) {
                    reject(event.target.error);
                };
            };
            request.onerror = function (event) {
                reject(event.target.error);
            };
        });
    },

    getAllItems: function (dbName, storeName) {
        return new Promise((resolve, reject) => {
            let request = indexedDB.open(dbName);

            request.onsuccess = function (event) {
                let db = event.target.result;
                let transaction = db.transaction(storeName, "readonly"); /*Fix here*/
                let store = transaction.objectStore(storeName);
                let items = [];

                store.openCursor().onsuccess = function (event) {
                    let cursor = event.target.result;
                    if (cursor) {
                        items.push(cursor.value);
                        cursor.continue();
                    } else {
                        resolve(items);
                    }
                };

                transaction.onerror = function (event) {
                    reject(event.target.error);
                };
            };

            request.onerror = function (event) {
                reject(event.target.error);
            };
        });
    },

    //1st
    // Get a random item from the store, excluding those with `isUsed` true (sth wrong)
    //getRandomItem: function (dbName, storeName) {
    //    return new Promise((resolve, reject) => {
    //        const openRequest = indexedDB.open(dbName);

    //        openRequest.onsuccess = function (event) {
    //            const db = event.target.result;
    //            const transaction = db.transaction(storeName, "readonly");
    //            const store = transaction.objectStore(storeName);
    //            const countRequest = store.count();
    //            console.log("Count:", countRequest);

    //            countRequest.onsuccess = function () {
    //                const count = countRequest.result;
    //                const randomIndex = Math.floor(Math.random() * count);
    //                console.log("Random index:", randomIndex);

    //                const cursorRequest = store.openCursor();

    //                cursorRequest.onsuccess = function (event) {
    //                    let cursor = event.target.result;
    //                    if (!cursor) {
    //                        resolve(null);  // No entries in the store
    //                        return;
    //                    }

    //                    if (randomIndex > 0) {  // Only call advance if randomIndex is greater than 0
    //                        cursor.advance(randomIndex);
    //                    } else {
    //                        // Handle the first item (randomIndex == 0) immediately
    //                        processCursor(cursor);
    //                    }
    //                };

    //                // Function to process cursor based on its "isUsed" property
    //                function processCursor(cursor) {
    //                    if (!cursor.value.isUsed) {
    //                        console.log("Selected value:", cursor.value);
    //                        resolve(cursor.value);
    //                    } else {
    //                        cursor.continue();  // Skip used entries and find the next unused entry
    //                    }
    //                }

    //                cursorRequest.onerror = function () {
    //                    resolve(null);  // Handle cursor errors or no valid cursor found
    //                };
    //            };

    //            transaction.onerror = function (event) {
    //                reject('Error traversing the store: ' + event.target.error);
    //            };
    //        };

    //        openRequest.onerror = function (event) {
    //            reject('Database error: ' + event.target.error);
    //        };
    //    });
    //},


    //Flow:
    //1. Get count,
    //2. Get Random,
    //3. Move cursor to random,
    //4. Check if isUsed is false, if => resolve, else must find until one with false is found, if no longer found, let it know
    //5.
    //getRandomItem until valid one is retrieved, no available item ? then null


    //2nd
    //getRandomItem: function (dbName, storeName) {
    //    return new Promise((resolve, reject) => {
    //        const openRequest = indexedDB.open(dbName);

    //        openRequest.onsuccess = function (event) {
    //            const db = event.target.result;
    //            const transaction = db.transaction(storeName, "readonly");
    //            const store = transaction.objectStore(storeName);
    //            const countRequest = store.count();

    //            countRequest.onsuccess = function () {
    //                const count = countRequest.result;

    //                if (count === 0) {
    //                    resolve(null); // No items in the store
    //                    return;
    //                }

    //                let randomIndex = Math.floor(Math.random() * count);
    //                console.log("Random index:", randomIndex);

    //                const cursorRequest = store.openCursor();
    //                let currentIndex = 0;
    //                let found = false; // Flag to track if a valid unused item is found

    //                cursorRequest.onsuccess = function (event) {
    //                    let cursor = event.target.result;

    //                    if (!cursor) {
    //                        if (!found) {
    //                            resolve(null); // No unused entries found
    //                        }
    //                        return;
    //                    }

    //                    if (currentIndex === randomIndex && !cursor.value.isUsed) {
    //                        console.log("Selected value:", cursor.value);
    //                        resolve(cursor.value);
    //                        found = true; // Mark that a valid unused item has been found
    //                    } else {
    //                        currentIndex++;
    //                        cursor.continue();
    //                    }
    //                };

    //                cursorRequest.onerror = function () {
    //                    resolve(null); // Handle cursor errors or no valid cursor found
    //                };
    //            };

    //            countRequest.onerror = function () {
    //                reject('Error counting the entries in the store');
    //            };

    //            transaction.onerror = function (event) {
    //                reject('Transaction error: ' + event.target.error);
    //            };
    //        };

    //        openRequest.onerror = function (event) {
    //            reject('Database error: ' + event.target.error);
    //        };
    //    });
    //},

    //3rd (this works good but not efficient)
    //getRandomItem: function (dbName, storeName) {
    //    return new Promise((resolve, reject) => {
    //        const openRequest = indexedDB.open(dbName);

    //        openRequest.onsuccess = function (event) {
    //            const db = event.target.result;
    //            const transaction = db.transaction(storeName, "readonly");
    //            const store = transaction.objectStore(storeName);
    //            const countRequest = store.count();

    //            countRequest.onsuccess = function () {
    //                const count = countRequest.result;

    //                if (count === 0) {
    //                    resolve(null); // No items in the store
    //                    return;
    //                }

    //                let randomIndex = Math.floor(Math.random() * count);
    //                console.log("Random index:", randomIndex);

    //                const cursorRequest = store.openCursor();
    //                let currentIndex = 0;
    //                let found = false; // Flag to track if a valid unused item is found

    //                cursorRequest.onsuccess = function (event) {
    //                    let cursor = event.target.result;

    //                    if (!cursor) {
    //                        if (found) {
    //                            return; // Exit if we've already found a valid item
    //                        } else if (currentIndex > randomIndex) {
    //                            // Restart from the beginning if we haven't found an unused entry yet
    //                            const newCursorRequest = store.openCursor();
    //                            newCursorRequest.onsuccess = cursorRequest.onsuccess;
    //                            return;
    //                        } else {
    //                            resolve(null); // No unused entries found after full loop
    //                            return;
    //                        }
    //                    }

    //                    // This part handles continuing the search even after the randomIndex is surpassed
    //                    if (currentIndex >= randomIndex && !cursor.value.isUsed) {
    //                        console.log("Selected value:", cursor.value);
    //                        resolve(cursor.value);
    //                        found = true; // Mark that a valid unused item has been found
    //                    } else {
    //                        currentIndex++;
    //                        cursor.continue(); // Continue to the next entry if not found
    //                    }
    //                };

    //                cursorRequest.onerror = function () {
    //                    resolve(null); // Handle cursor errors or no valid cursor found
    //                };
    //            };

    //            countRequest.onerror = function () {
    //                reject('Error counting the entries in the store');
    //            };

    //            transaction.onerror = function (event) {
    //                reject('Transaction error: ' + event.target.error);
    //            };
    //        };

    //        openRequest.onerror = function (event) {
    //            reject('Database error: ' + event.target.error);
    //        };
    //    });
    //},

    //4th (with id and while loop) (working)
    //getRandomItem: function (dbName, storeName) {
    //    return new Promise((resolve, reject) => {
    //        const openRequest = indexedDB.open(dbName);

    //        openRequest.onsuccess = function (event) {
    //            const db = event.target.result;
    //            const transaction = db.transaction(storeName, "readonly");
    //            const store = transaction.objectStore(storeName);
    //            const countRequest = store.count();

    //            countRequest.onsuccess = function () {
    //                const count = countRequest.result;

    //                if (count === 0) {
    //                    resolve(null); // No items in the store
    //                    return;
    //                }

    //                let randomId;
    //                let attemptCount = 0;
    //                const maxAttempts = 1000; // Prevent potential infinite loop

    //                // Find a randomId that is not in winnerIds
    //                while (attemptCount < maxAttempts) {
    //                    randomId = Math.floor(Math.random() * count) + 1; // IDs typically start at 1
    //                    attemptCount++;

    //                    if (!winnerIds.includes(randomId)) {
    //                        break; // Exit the loop if randomId is not a winner
    //                    }
    //                }

    //                if (attemptCount >= maxAttempts) {
    //                    resolve(null); // No valid randomId found after max attempts
    //                    return;
    //                }

    //                // Once a valid randomId is found, check if the entry is unused
    //                const getRequest = store.get(randomId);

    //                getRequest.onsuccess = function () {
    //                    const entry = getRequest.result;

    //                    if (entry && !entry.IsUsed) {
    //                        console.log("Selected value:", entry);
    //                        winnerIds.push(randomId); // Store the winner's ID
    //                        resolve(entry);
    //                    } else {
    //                        resolve(null); // No valid entry found
    //                    }
    //                };

    //                getRequest.onerror = function () {
    //                    console.log(`Failed to retrieve entry with ID ${randomId}`);
    //                    resolve(null); // Handle error by resolving null
    //                };
    //            };

    //            countRequest.onerror = function () {
    //                reject('Error counting the entries in the store');
    //            };

    //            transaction.onerror = function (event) {
    //                reject('Transaction error: ' + event.target.error);
    //            };
    //        };

    //        openRequest.onerror = function (event) {
    //            reject('Database error: ' + event.target.error);
    //        };
    //    });
    //},


    //5th (random and check with data from Prize store's winners)

    getRandomItem: function (entryDbName, entryStoreName, prizeDbName, prizeStoreName) {
        return new Promise((resolve, reject) => {
            // Step 1: Open the PrizeDatabase and get all winner IDs
            const prizeOpenRequest = indexedDB.open(prizeDbName);

            prizeOpenRequest.onsuccess = function (event) {
                const prizeDb = event.target.result;
                const prizeTransaction = prizeDb.transaction(prizeStoreName, "readonly");
                const prizeStore = prizeTransaction.objectStore(prizeStoreName);

                let winnerIds = [];

                // Fetch all prizes and accumulate winner IDs
                prizeStore.openCursor().onsuccess = function (event) {
                    const cursor = event.target.result;
                    if (cursor) {
                        const prize = cursor.value;
                        console.log("Prize found:", prize); 

                        if (prize.winners && prize.winners.length > 0) {
                            console.log("Prize has winners:", prize.winners); 

                            // Add each winner's ID to the winnerIds array
                            prize.winners.forEach(winner => {
                                console.log("Adding winner ID:", winner.id); 
                                winnerIds.push(winner.id);  
                            });
                        }
                        cursor.continue(); // Continue to the next prize
                    } else {
                        // Step 2: Now that we have winnerIds, open the EntryDatabase and find a random item
                        console.log(winnerIds);
                        const entryOpenRequest = indexedDB.open(entryDbName);

                        entryOpenRequest.onsuccess = function (event) {
                            const db = event.target.result;
                            const transaction = db.transaction(entryStoreName, "readonly");
                            const store = transaction.objectStore(entryStoreName);
                            const countRequest = store.count();

                            countRequest.onsuccess = function () {
                                const count = countRequest.result;

                                if (count === 0) {
                                    resolve(null); // No items in the store
                                    return;
                                }

                                let randomId;
                                let attemptCount = 0;
                                const maxAttempts = 1000; // Prevent potential infinite loop

                                // Find a randomId that is not in winnerIds
                                while (attemptCount < maxAttempts) {
                                    randomId = Math.floor(Math.random() * count) + 1; // IDs typically start at 1
                                    attemptCount++;

                                    if (!winnerIds.includes(randomId)) {
                                        break; // Exit the loop if randomId is not a winner
                                    }
                                }

                                if (attemptCount >= maxAttempts) {
                                    resolve(null); // No valid randomId found after max attempts
                                    return;
                                }

                                // Once a valid randomId is found, check if the entry is unused
                                const getRequest = store.get(randomId);

                                getRequest.onsuccess = function () {
                                    const entry = getRequest.result;

                                    if (entry && !entry.IsUsed) {
                                        console.log("Selected value:", entry);
                                        resolve(entry);
                                    } else {
                                        resolve(null); // No valid entry found
                                    }
                                };

                                getRequest.onerror = function () {
                                    console.log(`Failed to retrieve entry with ID ${randomId}`);
                                    resolve(null); // Handle error by resolving null
                                };
                            };

                            countRequest.onerror = function () {
                                reject('Error counting the entries in the store');
                            };

                            transaction.onerror = function (event) {
                                reject('Transaction error: ' + event.target.error);
                            };
                        };

                        entryOpenRequest.onerror = function (event) {
                            reject('Database error: ' + event.target.error);
                        };
                    }
                };

                prizeTransaction.onerror = function (event) {
                    reject('Transaction error: ' + event.target.error);
                };
            };

            prizeOpenRequest.onerror = function (event) {
                reject('Database error: ' + event.target.error);
            };
        });
    },

   

    updateItem: function (dbName, storeName, item) {
        return new Promise((resolve, reject) => {
            let request = indexedDB.open(dbName);
            request.onsuccess = function (event) {
                let db = event.target.result;
                let transaction = db.transaction(storeName, "readwrite");
                let store = transaction.objectStore(storeName);
                let updateRequest = store.put(item);
                updateRequest.onsuccess = function () {
                    resolve(true);
                };
                updateRequest.onerror = function (event) {
                    reject(event.target.error);
                };
            };
            request.onerror = function (event) {
                reject(event.target.error);
            };
        });
    },

    updateAllItems: function (dbName, storeName, items) {
        return new Promise((resolve, reject) => {
            let request = indexedDB.open(dbName);
            request.onsuccess = function (event) {
                let db = event.target.result;
                let transaction = db.transaction(storeName, "readwrite");
                let store = transaction.objectStore(storeName);

                let updatePromises = items.map(item => {
                    return new Promise((innerResolve, innerReject) => {
                        let updateRequest = store.put(item);
                        updateRequest.onsuccess = innerResolve;
                        updateRequest.onerror = innerReject;
                    });
                });

                Promise.all(updatePromises)
                    .then(() => resolve(true))
                    .catch(error => reject(error));

                transaction.onerror = function (event) {
                    reject(event.target.error);
                };
            };
            request.onerror = function (event) {
                reject(event.target.error);
            };
        });
    },

    deleteItem: function (dbName, storeName, key) {
        return new Promise((resolve, reject) => {
            let request = indexedDB.open(dbName);

            request.onsuccess = function (event) {
                let db = event.target.result;
                let transaction = db.transaction(storeName, "readwrite");
                let store = transaction.objectStore(storeName);
                store.delete(key);

                transaction.oncomplete = function () {
                    resolve(true);
                };

                transaction.onerror = function (event) {
                    reject(event.target.error);
                };
            };

            request.onerror = function (event) {
                reject(event.target.error);
            };
        });
    },

    getItemByInternalKey: function (dbName, storeName, internalKey) {
        return new Promise((resolve, reject) => {
            let request = indexedDB.open(dbName);
            request.onsuccess = function (event) {
                let db = event.target.result;
                let transaction = db.transaction(storeName, "readonly");
                let store = transaction.objectStore(storeName);
                let cursorRequest = store.openCursor();
                let currentIndex = 0;

                cursorRequest.onsuccess = function (event) {
                    let cursor = event.target.result;
                    if (cursor) {
                        if (currentIndex === internalKey) {
                            resolve(cursor.value);
                            return;
                        }
                        currentIndex++;
                        cursor.continue();
                    } else {
                        resolve(null); // If the cursor runs out of items
                    }
                };

                cursorRequest.onerror = function (event) {
                    reject(event.target.error);
                };
            };

            request.onerror = function (event) {
                reject(event.target.error);
            };
        });
    },

    getAllItemsWithInternalKeys: function (dbName, storeName) {
        return new Promise((resolve, reject) => {
            let request = indexedDB.open(dbName);

            request.onsuccess = function (event) {
                let db = event.target.result;
                let transaction = db.transaction(storeName, "readonly");
                let store = transaction.objectStore(storeName);
                let items = [];

                store.openCursor().onsuccess = function (event) {
                    let cursor = event.target.result;
                    if (cursor) {
                        items.push({
                            internalKey: cursor.key,
                            value: cursor.value
                        });
                        cursor.continue();
                    } else {
                        resolve(items);
                    }
                };

                transaction.onerror = function (event) {
                    reject(event.target.error);
                };
            };

            request.onerror = function (event) {
                reject(event.target.error);
            };
        });
    },

    clearStore: function (dbName, storeName) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName);
            request.onsuccess = function (event) {
                const db = event.target.result;
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const clearRequest = store.clear();

                clearRequest.onsuccess = function () {
                    resolve('All entries deleted successfully.');
                };
                clearRequest.onerror = function (event) {
                    reject('Error deleting entries: ' + event.target.error);
                };
            };
            request.onerror = function (event) {
                reject('Database error: ' + event.target.error);
            };
        });
    },

    deleteDatabase: function (dbName) {
        return new Promise((resolve, reject) => {
            // Close any open connections to the database
            const closeAllConnections = () => {
                const dbOpenRequest = indexedDB.open(dbName);
                dbOpenRequest.onsuccess = function (event) {
                    const db = event.target.result;
                    db.close(); // Close the database connection
                };
            };

            // First, close all connections
            closeAllConnections();

            // Then, attempt to delete the database
            const request = indexedDB.deleteDatabase(dbName);

            request.onsuccess = function () {
                resolve('Database deleted successfully.');
            };

            request.onerror = function (event) {
                reject('Error deleting database: ' + event.target.error);
            };

            request.onblocked = function () {
                reject('Database deletion blocked. Make sure all connections are closed.');
            };
        });
    },

    addImageToGallery: function (dbName, storeName, imageData) {
        return new Promise((resolve, reject) => {
            let request = indexedDB.open(dbName);

            request.onsuccess = function (event) {
                let db = event.target.result;
                let transaction = db.transaction(storeName, "readwrite");
                let store = transaction.objectStore(storeName);
                store.add({ image: imageData });

                transaction.oncomplete = function () {
                    resolve(true);
                };

                transaction.onerror = function (event) {
                    reject(event.target.error);
                };
            };

            request.onerror = function (event) {
                reject(event.target.error);
            };
        });
    },

    getAllImagesFromGallery: function (dbName, storeName) {
        return new Promise((resolve, reject) => {
            let request = indexedDB.open(dbName);

            request.onsuccess = function (event) {
                let db = event.target.result;
                let transaction = db.transaction(storeName, "readonly");
                let store = transaction.objectStore(storeName);
                let images = [];

                store.openCursor().onsuccess = function (event) {
                    let cursor = event.target.result;
                    if (cursor) {
                        images.push(cursor.value.image);
                        cursor.continue();
                    } else {
                        resolve(images);
                    }
                };

                transaction.onerror = function (event) {
                    reject(event.target.error);
                };
            };

            request.onerror = function (event) {
                reject(event.target.error);
            };
        });
    }
    

};
