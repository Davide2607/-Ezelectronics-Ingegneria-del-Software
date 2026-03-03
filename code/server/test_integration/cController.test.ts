import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import db from "../src/db/db"
import { cleanup, create_tables } from "../src/db/cleanup"
import CartController from "../src/controllers/cartController"
import CartDAO from "../src/dao/cartDAO"
import ProductDAO from "../src/dao/productDAO";
import { Cart, ProductInCart } from "../src/components/cart"
import { User, Role} from "../src/components/user"
import {Product, Category} from "../src/components/product"
import * as cartErrors from "../src/errors/cartError"
import { ProductNotFoundError } from "../src/errors/productError";
import { rejects } from "assert"

const routePath = "/ezelectronics"

const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
}

const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.header["set-cookie"][0])
            })
    })
}


describe("Integration Test Controller Carts", ()=>{

    let cartController:CartController;
    let cart1:Cart;
    let cart2:Cart;
    let cart3:Cart;
    let cart4:Cart;
    let cart5:Cart;
    let cart6:Cart;

    let user1:User;
    let user2:User;
    let user3:User;
    let user4:User;
    let user5:User;

    let prodottoCart1:ProductInCart;
    let prodottoCart2:ProductInCart;
    let prodottoCart3:ProductInCart;  //usato per simulare prodotto che pero non è stato inserito nel db
    let prodottoCart4:ProductInCart; 
    let prodotto_Cart_gia_esistente:ProductInCart;

    let product1:Product;
    let product2:Product;
    let product3:Product;

    interface CartInterface {
        idCart: number;
        customer: string;
        paid: boolean;
        paymentDate: Date;
        total: number;
    }
 

    beforeAll(async () => {
        
        cartController = new CartController()
        product1= new Product(10, "modelSmartphone", Category.SMARTPHONE, "2021-10-10", "details", 100);
        product2= new Product(10, "modelLaptotp1", Category.LAPTOP, "2021-10-10", "details", 100);
        product3= new Product(10, "modelLaptotp2", Category.LAPTOP, "2021-10-10", "details", 0);
        
        user1 = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-21");
        user2 = new User("testUser2", "Test2", "User2", Role.MANAGER, "Via Bianchi 123", "2014-04-21");
        user3 = new User("testUser3", "Test3", "User3", Role.CUSTOMER, "Via Bianchi 123", "2014-04-21");
        user4 = new User("testUser4", "Test4", "User4", Role.CUSTOMER, "Via Bianchi 123", "2014-04-21");
        user5 = new User("testUser5", "Test5", "User5", Role.CUSTOMER, "Via Bianchi 123", "2014-04-21");

        prodottoCart1 = new ProductInCart(product1.model, 1, product1.category, product1.sellingPrice)
        prodottoCart2=  new ProductInCart(product2.model,2, product2.category, product2.sellingPrice)
        prodottoCart3=  new ProductInCart(product3.model,0, product3.category, product3.sellingPrice)
        prodottoCart4=  new ProductInCart(product1.model,2, product1.category, product1.sellingPrice)

        cart1 = new Cart(user1.username, true, '2024-05-29', 10, [prodottoCart1]);
        cart2 = new Cart(user2.username, true, "2024-04-21", 10, [prodottoCart2]);
        cart3 = new Cart(user3.username, false, ' ', 10, [prodottoCart3]);  // simula cart non pagato per utente3 
        cart4 = new Cart(user4.username,false, ' ' ,0, []) // Cart senza prodotti 
        cart5= new Cart(user1.username, false, ' ', 10, [prodottoCart4]); //usato per il checkout del cart user1
        cart6= new Cart(user5.username, false, " ", 0, []); //usato per il checkout del cart user5

        await create_tables();
        await cleanup();
        jest.spyOn(db, "get");
        jest.spyOn(db, "all");
        jest.spyOn(db, "run");

        db.serialize(async () => {
            db.run(`
                INSERT INTO products (model, category, sellingPrice, arrivalDate, details, quantity)
                VALUES (?, ?, ?, ?, ?, ?),
                       (?, ?, ?, ?, ?, ?),
                       (?, ?, ?, ?, ?, ?)
            `, [
                product1.model, product1.category, product1.sellingPrice, product1.arrivalDate, product1.details, product1.quantity,
                product2.model, product2.category, product2.sellingPrice, product2.arrivalDate, product2.details, product2.quantity,
                product3.model, product3.category, product3.sellingPrice, product3.arrivalDate, product3.details, product3.quantity
            ]);
            
            db.run(`
                INSERT INTO users (username, name, surname, role, password, salt, address, birthdate)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?),
                       (?, ?, ?, ?, ?, ?, ?, ?),
                       (?, ?, ?, ?, ?, ?, ?, ?),
                       (?, ?, ?, ?, ?, ?, ?, ?),
                       (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                user1.username, user1.name, user1.surname, user1.role, "password", "salt", user1.address, user1.birthdate,
                user2.username, user2.name, user2.surname, user2.role, "password", "salt", user2.address, user2.birthdate,
                user3.username, user3.name, user3.surname, user3.role, "password", "salt", user3.address, user3.birthdate,
                user4.username, user4.name, user4.surname, user4.role, "password", "salt", user4.address, user4.birthdate,
                user5.username, user5.name, user5.surname, user5.role, "password", "salt", user5.address, user5.birthdate
            ]);

            db.run(`
                INSERT INTO carts (idCart, customer, paid, paymentDate, total)
                VALUES (?, ?, ?, ?, ?),
                       (?, ?, ?, ?, ?),
                       (?, ?, ?, ?, ?),
                       (?, ?, ?, ?, ?),
                       (?, ?, ?, ?, ?),
                        (?, ?, ?, ?, ?)
            `, [
                1, user1.username, cart1.paid, cart1.paymentDate, cart1.total,
                2, user2.username, cart2.paid, cart2.paymentDate, cart2.total,
                3, user3.username, cart3.paid, cart3.paymentDate, cart3.total,
                4, user4.username, cart4.paid, cart4.paymentDate, cart4.total,
                5, user1.username, cart5.paid, cart5.paymentDate, cart5.total,
                6, user5.username, cart6.paid, cart6.paymentDate, cart6.total
            ]);

            db.run(`
                INSERT INTO cartProducts (idCart, product, cartQuantity)
                VALUES (?, ?, ?),
                       (?, ?, ?),
                       (?, ?, ?),
                       (?, ?, ?)
            `, [
                1, prodottoCart1.model, 1,
                2, prodottoCart2.model, 2,
                3, prodottoCart3.model, 2,
                5, prodottoCart4.model, 1
            ]);
        })
       
    

    })

    afterAll(async()=>{
        await cleanup();
        await new Promise((resolve, reject) => {
            db.close((err) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                } else {
                    resolve(null);
                }
            });
        });
    })

   

    beforeEach(async()=>{
        jest.clearAllMocks();
    })
    
    afterEach(async ()=>{

    })

    describe("Create a new cart", () => {
        test("Correct functionality", async () => {
            const result = await cartController.addToCart(user2, prodottoCart2.model);
            expect(result).toBe(true);
           
        });
        
        test("Add a product to existing cart", async () => {
            const result = await cartController.addToCart(user1, prodottoCart1.model);
            expect(result).toBe(true);

            // Verifichiamo se il prodotto è stato aggiunto correttamente
            const productsInCart = await new Promise<ProductInCart[]>((resolve, reject) => {
                db.all("SELECT * FROM cartProducts WHERE idCart = ?", [1], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows.map(row => new ProductInCart(product1.model, product1.quantity, product1.category, product1.sellingPrice)));
                    }
                });
            });

            expect(productsInCart).toHaveLength(1);
            expect(productsInCart[0].model).toBe(prodottoCart1.model);
        });

        test("Add a product to an empty cart", async()=>{
            const result = await cartController.addToCart(user4, prodottoCart4.model);
            expect(result).toBe(true);
        
        })

        
    });
    
    describe("GetCart", () => {
        test("Correct functionality", async () => {
            const result = await cartController.getCart(user1);

            expect(result.customer).toBe(user1.username);
            expect(result.paid).toEqual(0);
            expect(result.paymentDate).toBe(" ");
          });
        
        test("Returns an empty cart", async()=>{
            const result = await cartController.getCart(user5);
            expect(result.customer).toBe(user5.username);
            expect(result.paid).toEqual(false);
            expect(result.paymentDate).toBe(null);
        
        })


    });

        describe("CheckoutCart", () => {
            test("Correct functionality - cart checkout", async () => {
   
    
                // Esegui il checkout dei carrelli degli utenti
                const result1 = await cartController.checkoutCart(user1);
    
                // Verifica che il checkout abbia avuto successo per entrambi gli utenti
                expect(result1).toBe(true);
            });
        
            test("Error - product not available", async () => {
    
                // Esegui il checkout del carrello dell'utente 1 e verifica che lanci un errore
                await expect(cartController.checkoutCart(user5)).rejects.toThrow(new cartErrors.EmptyCartError().message);
            });
        });
        describe("GetPaidCart", () => {
            test("Correct functionality", async () => {
                const result = await cartController.getCustomerCarts(user2);
                const normalizePaid = (paid:boolean) => {
                    return paid ? 1 : 0;
                };
                expect(result[0].customer).toBe(user2.username);
                expect(result[0].paid).toBe(normalizePaid(cart2.paid));
                expect(result[0].paymentDate).toBe(cart2.paymentDate);
                expect(result[0].products[0].model).toBe(cart2.products[0].model);
                expect(result[0].total).toBe(cart2.products[0].price);
            });
            
            test("It should reject with CartNotFoundError when no paid carts are found", async()=>{
                await expect(cartController.getCustomerCarts(user5))
                    .resolves.toEqual([]);
            })


        });

    describe("RemoveProductFromCart", () => {
        test("Correct functionality - remove one product unit from cart", async () => {


            // Rimuovi una unità del primo prodotto dal carrello
            const result1 = await cartController.removeProductFromCart(user3, prodottoCart3.model);

            // Verifica che la rimozione abbia avuto successo
            expect(result1).toBe(true);
        });

        test("Error - product not in cart", async () => {
            await expect(cartController.removeProductFromCart(user4, prodottoCart3.model))
                .rejects
                .toThrow(new cartErrors.ProductNotInCartError());
        });


        test("Empty cart", async () => {
            await expect(cartController.removeProductFromCart(user5, prodottoCart2.model))
                .rejects
                .toThrow(new cartErrors.EmptyCartError());
        })

        test("Correct functionality - delete product from cart", async () => {
            const result2 = await cartController.removeProductFromCart(user3, prodottoCart3.model);
            expect(result2).toBe(true);
        })


    });
    describe("ClearCart", () => {
        test("Correct functionality - clear cart", async () => {
   
            // Svuota il carrello
            const result = await cartController.clearCart(user4);

            // Verifica che lo svuotamento abbia avuto successo
            expect(result).toBe(true);

        });
   
        test("Error - cart is already empty", async () => {
            await expect(cartController.clearCart(user4))
            .rejects
            .toThrow(new cartErrors.EmptyCartError())
        });
    });

    describe("GetAllCarts", () => {
        test("Correct functionality - retrieve all carts", async () => {

            // Ottieni tutti i carrelli dal database
            const allCarts = await cartController.getAllCarts();

            // Verifica che i carrelli siano stati ottenuti correttamente
            expect(allCarts).toHaveLength(4);
        });
      });

    describe("DeleteAllCarts", () => {
        test("Correct functionality - delete all carts", async () => {
 
            // Cancella tutti i carrelli
            const result = await cartController.deleteAllCarts();

            // Verifica che la cancellazione abbia avuto successo
            expect(result).toBe(true);
        });
    });

    
});