"use strict"

import db from "../db/db";

/**
 * Deletes all data from the database.
 * This function must be called before any integration test, to ensure a clean database state for each test run.
 */

export async function create_tables(){
    db.serialize(()=>{
      db.exec(`CREATE TABLE IF NOT EXISTS "users" ("username" TEXT NOT NULL UNIQUE,"name"	TEXT NOT NULL,"surname"	TEXT NOT NULL,"role"	TEXT NOT NULL,"password"	TEXT, "salt"	TEXT,"address"	TEXT,"birthdate"	TEXT,PRIMARY KEY("username"))`)
      db.exec(`CREATE TABLE IF NOT EXISTS "products" ("model" TEXT NOT NULL UNIQUE,"sellingPrice" DOUBLE NOT NULL,"category" TEXT CHECK( category IN ('Smartphone', 'Laptop', 'Appliance')) NOT NULL,"arrivalDate" TEXT,"details" TEXT,"quantity" INTEGER NOT NULL,PRIMARY KEY(model))`)
      db.exec(`CREATE TABLE IF NOT EXISTS "carts" ("idCart"	INTEGER PRIMARY KEY  UNIQUE,"customer"	TEXT NOT NULL,"paid"	 BOOLEAN NOT NULL,"paymentDate" TEXT,"total"	DOUBLE NOT NULL,FOREIGN KEY (customer) REFERENCES users(username) ON DELETE CASCADE)`)
      db.exec(`CREATE TABLE IF NOT EXISTS "cartProducts"("idCart" INTEGER,"product" TEXT,"cartQuantity" INTEGER NOT NULL,PRIMARY KEY (idCart, product),FOREIGN KEY (idCart) REFERENCES carts(idCart) ON DELETE CASCADE,FOREIGN KEY (product) REFERENCES products(model) ON DELETE CASCADE)`)
      db.exec(`CREATE TABLE IF NOT EXISTS "productReview"("model" TEXT,"user" TEXT,"score" INTEGER CHECK(score >= 1 AND score <= 5) NOT NULL,"date" TEXT NOT NULL,"comment" TEXT NOT NULL,FOREIGN KEY (model) REFERENCES products(model) ON DELETE CASCADE,FOREIGN KEY (user) REFERENCES users(username) ON DELETE CASCADE,PRIMARY KEY(model, user))`)
    })

    jest.clearAllMocks()
    
}

export function cleanup() {
      // Delete all data from the database.
     
      db.run("DELETE FROM cartProducts")
      db.run("DELETE FROM productReview")
      db.run("DELETE FROM carts")
      db.run("DELETE FROM users")
      //Add delete statements for other tables here
      db.run("DELETE FROM products")

  jest.clearAllMocks()
}
