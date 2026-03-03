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

describe("Integration Test DAO Carts", ()=>{

    let cartDAO:CartDAO;
    let cart1:Cart;
    let cart2:Cart;
    let cart3:Cart;
    let cart4:Cart;

    let user1:User;
    let user2:User;
    let user3:User;
    let user4:User;
    let prodottoCart1:ProductInCart;
    let prodottoCart2:ProductInCart;
    let prodottoCart3:ProductInCart;  //usato per simulare prodotto che pero non è stato inserito nel db
    let prodottoCart4:ProductInCart;

    let product1:Product;
    let product2:Product;
    let product3:Product;
    let product4:Product;

    interface CartInterface {
        idCart: number;
        customer: string;
        paid: boolean;
        paymentDate: Date;
        total: number;
    }
 

    beforeAll(async () => {
        cartDAO = new CartDAO()
        product1= new Product(10, "modelSmartphone", Category.SMARTPHONE, "2021-10-10", "details", 100);
        product2= new Product(10, "modelLaptotp1", Category.LAPTOP, "2021-10-10", "details", 100);
        product3= new Product(10, "modelLaptotp2", Category.LAPTOP, "2021-10-10", "details", 100);
        product4= new Product(10, "modelSmartphone2", Category.SMARTPHONE, "2021-10-10", "details", 100);

        user1 = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-21");
        user2 = new User("testUser2", "Test2", "User2", Role.MANAGER, "Via Bianchi 123", "2014-04-21");
        user3 = new User("testUser3", "Test3", "User3", Role.CUSTOMER, "Via Bianchi 123", "2014-04-21");
        user4 = new User("testUser4", "Test4", "User4", Role.CUSTOMER, "Via Bianchi 123", "2014-04-21");

        prodottoCart1 = new ProductInCart(product1.model, 1, product1.category, product1.sellingPrice)
        prodottoCart2=  new ProductInCart(product2.model,2, product2.category, product2.sellingPrice)
        prodottoCart3=  new ProductInCart(product3.model,2, product3.category, product3.sellingPrice)
        prodottoCart4=  new ProductInCart(product4.model,2, product4.category, product4.sellingPrice)  //simula cart not found error

        cart1 = new Cart(user1.username, true, '2024-05-29', 10, [prodottoCart1]);
        cart2 = new Cart(user2.username, true, "2024-04-21", 10, [prodottoCart2]);
        cart3 = new Cart(user1.username, false, '', 10, []);  // simula cart non pagato e vuoto per utente1 
        cart4 = new Cart(user2.username,false, '' ,20, [prodottoCart4]) // Cart senza prodotti
   
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
                       (?, ?, ?, ?, ?, ?),
                       (?, ?, ?, ?, ?, ?)`,
                [
                    product1.model, product1.category, product1.sellingPrice, product1.arrivalDate, product1.details, product1.quantity,
                    product2.model, product2.category, product2.sellingPrice, product2.arrivalDate, product2.details, product2.quantity,
                    product3.model, product3.category, product3.sellingPrice, product3.arrivalDate, product3.details, product3.quantity,
                    product4.model, product4.category, product4.sellingPrice, product4.arrivalDate, product4.details, product4.quantity
                ]
                );

            db.run(`
            INSERT INTO users (username, name, surname, role, password, salt, address, birthdate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?),
                   (?, ?, ?, ?, ?, ?, ?, ?),
                   (?, ?, ?, ?, ?, ?, ?, ?),
                   (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                user1.username, user1.name, user1.surname, user1.role, "password", "salt", user1.address, user1.birthdate,
                user2.username, user2.name, user2.surname, user2.role, "password", "salt", user2.address, user2.birthdate,
                user3.username, user3.name, user3.surname, user3.role, "password", "salt", user3.address, user3.birthdate,
                user4.username, user4.name, user4.surname, user4.role, "password", "salt", user4.address, user4.birthdate
            ]
            );

           

            db.run(`
            INSERT INTO carts (idCart, customer, paid, paymentDate, total)
            VALUES (?, ?, ?, ?, ?),
                   (?, ?, ?, ?, ?),
                   (?, ?, ?, ?, ?),
                   (?, ?, ?, ?, ?)`,
            [
                1,user1.username, cart1.paid, cart1.paymentDate, cart1.total,
                2,user2.username, cart2.paid, cart2.paymentDate, cart2.total,
                3,user1.username, cart3.paid, cart3.paymentDate, cart3.total,
                4,user2.username, cart4.paid, cart4.paymentDate, cart4.total
            ]
            );

            db.run(`
            INSERT INTO cartProducts (idCart, product, cartQuantity)
            VALUES (?, ?, ?),
                   (?, ?, ?),
                   (?, ?, ?)`,
            [
                1, prodottoCart1.model, 1,
                2, prodottoCart2.model, 2,
                4, prodottoCart4.model, 2
            ]
            );
        });

  

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
    //--------------------------------------------
    describe("Create a new cart", () => {
        test("Correct functionality", async () => {
            const result = await cartDAO.createCart(user3, product3);
            expect(result).toBe(true);
           
        });
        

    });

    describe("Create Empty Cart", () => {
        test("Correct functionality", async () => {
            const result = await cartDAO.createEmptyCart(user3);
            expect(result).toEqual({"customer": user3.username, "paid": false, "paymentDate": null, "products": [], "total":0});
        });

       
    })
    //---------------------------------------------------
    describe("GetPaidCart", () => {
        test("Correct functionality", async () => {
            const result = await cartDAO.getPaidCart(user2);
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
            await expect(CartDAO.prototype.getPaidCart(user3)).resolves.toEqual([]);
        })

        
    });
  //----------------------------------------------------------------  
    describe("GetUnpaidCart", () => {
        test("Correct functionality", async () => {
            const result = await cartDAO.getUnpaidCart(user2);
            
            expect(result.customer).toBe(user2.username);
            expect(result.paid).toBe(0);
            expect(result.paymentDate).toBe("");
        });

        test("No unpaid carts found", async () => {
            await expect(cartDAO.getUnpaidCart(user4)).rejects.toThrow(cartErrors.CartNotFoundError);
           
        });

     
    });
//----------------------------------------------------------
    describe("GetUnpaidCartId", () => {
        test("Correct functionality", async () => {
            const result = await cartDAO.getUnpaidCartId(user1);
            expect(result).toBe(3);
        });

        test("No unpaid cart found", async () => {
            const result = await cartDAO.getUnpaidCartId(user4);
            expect(result).toBe(null);
        });

    });
//-------------------------------------------------------------
    describe("GetEmptyCart", () => {
        test("Correct functionality", async () => {
            const result = await cartDAO.getEmptyCart(user1);
            expect(result.customer).toBe(user1.username);
            expect(result.paid).toBe(0);
            expect(result.products.length).toBe(0);
        });

        test("No unpaid cart found", async () => {
            await expect(cartDAO.getEmptyCart(user4)).rejects.toThrow(cartErrors.CartNotFoundError);
        });

    });
    describe("getAllCarts", () => {
        test("Correct functionality with multiple carts", async () => {
            const result = await cartDAO.getAllCarts();

            expect(result.length).toBe(4); // verifica il numero totale di carrelli restituiti
        });


   
    });
    //------------------------------------------
    describe("changeProductNumberInCart", () => {
    test("Correct functionality - increment product quantity", async () => {
        const result = await cartDAO.changeProductNumberInCart(prodottoCart1.model, 1, "increment");
    
        expect(result).toBe(true);

    });
    
    test("Correct functionality - decrement product quantity", async () => {
        const result2 =await cartDAO.changeProductNumberInCart(prodottoCart2.model,2, "decrement");
        expect(result2).toBe(true);
       
    });

    test("Invalid operation", async () => {
        await expect(cartDAO.changeProductNumberInCart(prodottoCart1.model, 1, "invalidOperation")).rejects.toThrow(new Error("Invalid operation"));
    });

    test("Product not in cart", async () => {
        await expect(cartDAO.changeProductNumberInCart(prodottoCart3.model, 1, "increment")).rejects.toThrow(cartErrors.ProductNotInCartError);
    })


  });

  //----------------------------------------------
  describe("UpdateTotalCart", () => {
    test("Correct functionality", async () => {
        const result = await cartDAO.updateTotalCart(1);
    
        expect(result).toBe(true);

    });

    test("Cart not found", async () => {
        await expect(cartDAO.updateTotalCart(10000000)).rejects.toThrow(cartErrors.CartNotFoundError);
    })

  

  });
  //--------------------------------------------------
  describe("ManageProductToCart", () => {
    test("Correct functionality - insert product in cart", async () => {
        const result = await cartDAO.ManageProductToCart(prodottoCart3.model,1, "insert");
        expect(result).toBe(true);

    });
    
    test("Correct functionality - delete product from cart", async () => {
        const result2 = await cartDAO.ManageProductToCart(prodottoCart1.model,1, "delete");
        expect(result2).toBe(true);
       
    });

    test("Invalid operation", async () => {
        await expect(cartDAO.ManageProductToCart(prodottoCart1.model,1, "Invalidoperation")).rejects.toThrow(new Error("Invalid operation"));
    });

    test("Product not in cart", async () => {
        await expect(cartDAO.ManageProductToCart(prodottoCart4.model,1, "delete")).rejects.toThrow(cartErrors.ProductNotInCartError);
     })

 

  });
//----------------------------------------------

describe("CheckoutCart", () => {
  test("Correct functionality - checkout cart", async () => {
    const result = await cartDAO.checkoutCart(user3);
    expect(result).toBe(true);
     
    });
  test("Cart not found", async () => {
    await expect(cartDAO.checkoutCart(user4)).rejects.toThrow(cartErrors.EmptyCartError);
  })


});
describe("clearUnpaidCart", () => {
    test("Correct functionality - clear unpaid cart", async () => {
        const result = await cartDAO.clearUnpaidCart(2);
        expect(result).toBe(true);

    });
    test("Cart not found", async () => {
        await expect(cartDAO.clearUnpaidCart(10)).rejects.toThrow(cartErrors.CartNotFoundError);
    })



});

describe("DeleteAllCarts", () => {
    test("Correct functionality", async () => {
        const result = await cartDAO.deleteAllCarts();
        expect(result).toBe(true);

    });



});

});


