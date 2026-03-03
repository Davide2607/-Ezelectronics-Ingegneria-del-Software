import { describe, test, expect, beforeAll, afterAll,afterEach, jest } from "@jest/globals"

import CartDAO from "../../src/dao/cartDAO"
import * as cartErrors from "../../src/errors/cartError"
import { User, Role} from "../../src/components/user"
import { Cart, ProductInCart } from "../../src/components/cart"
import testdb from "../../src/db/db"
import { Database } from "sqlite3"
import dayjs from "dayjs";
import { Category, Product } from "../../src/components/product"


jest.mock("../../src/db/db.ts")


describe('CartDAO.createCart', () => {
    test("It should resolve true on successful cart creation", async () => {
        const cartDAO = new CartDAO();
        
        const mockDBRun = jest.spyOn(testdb, "run").mockImplementationOnce((sql, params, callback) => {
            callback.call({ idCart: 1 }, null); // Simulate successful insertion of cart with lastID 1
            return {} as Database;
        }).mockImplementationOnce((sql, params, callback) => {
            callback(null); // Simulate successful insertion of cartProduct
            return {} as Database;
        });
        const new_product = new Product(10,"testModel",Category.SMARTPHONE,null, "detail",10 )
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-21");
       const result = await cartDAO.createCart(user, new_product);
        expect(result).toBe(true);

        mockDBRun.mockRestore();
    });

    test("It should reject with error on cart insertion failure", async () => {
        const cartDAO = new CartDAO();

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Database Error"),undefined); // Simulate failure on cart insertion
            return {} as Database;
        });

        const new_product = new Product(10,"testModel",Category.SMARTPHONE,null, "detail",10 )
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-21");
       await expect(cartDAO.createCart(user, new_product))
            .rejects
            .toThrow(new Error("Database Error"));

        mockDBRun.mockRestore();
    });

    test("It should reject with error on cartProduct insertion failure", async () => {
        const cartDAO = new CartDAO();

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementationOnce((sql, params, callback) => {
            callback.call({ lastID: 1 }, null); // Simulate successful insertion of cart with lastID 1
            return {} as Database;
        }).mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Database Error"),undefined); // Simulate failure on cartProduct insertion
            return {} as Database;
        });

        const new_product = new Product(10,"testModel",Category.SMARTPHONE,null, "detail",10 )
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-21");
       await expect(cartDAO.createCart(user, new_product))
            .rejects
            .toThrow(new Error("Database Error"));

        mockDBRun.mockRestore();
    });

    test("It should handle unexpected errors", async () => {
        const cartDAO = new CartDAO();
        const unexpectedError = new Error('Unexpected Error');

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementationOnce(() => { throw unexpectedError; });

        const new_product = new Product(10,"testModel",Category.SMARTPHONE,null, "detail",10 )
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-21");
       await expect(cartDAO.createCart(user, new_product))
            .rejects
            .toThrow(unexpectedError);

        mockDBRun.mockRestore();
    });
});

//-----------------------------------------------


describe("CartDao.createEmptyCart", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("It should resolve with true on successful cart creation", async () => {
        const cartDAO = new CartDAO();

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementationOnce((sql, params, callback) => {
            callback.call({ idCart: 1 }, null); // Simulate successful insertion of cart with lastID 1
            return {} as Database;
        });
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-21");
        const result = await cartDAO.createEmptyCart(user);

        expect(result).toEqual({customer: "testUser", paid: false, paymentDate: null, total: 0, products: []});
        expect(mockDBRun).toHaveBeenCalledWith(
            "INSERT INTO carts (idCart, customer, paid, paymentDate, total) VALUES (?,?, ?, ?, ?)",
            [null, "testUser", false, null, 0],
            expect.any(Function)
        );
        mockDBRun.mockRestore();
    });

    test("It should reject with an error on database failure", async () => {
        const cartDAO = new CartDAO();

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Database Error"), undefined); // Simulate failure on cart insertion
            return {} as Database;
        });

        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-21");
        await expect(cartDAO.createEmptyCart(user))
            .rejects
            .toThrow(new Error("Database Error"));

        mockDBRun.mockRestore();
    });

})

describe('CartDAO.getPaidCart', () => {
    afterEach(() => {
        jest.clearAllMocks(); 
    });
    test("It should resolve with a list of paid carts", async () => {
        // Simula il comportamento di testdb.all quando ci sono carrelli pagati
        const mockDBAll= jest.spyOn(testdb, "all").mockImplementation((sql, params, callback) => {
            const rows = [
                // Mock dei dati dei carrelli pagati
                { 
                    idCart: 1,
                    customer: "testUser",
                    paid: true,
                    paymentDate: "2024-04-21",
                    total: 100,
                    product: "testModel",
                    cartQuantity: 2,
                    category: "Laptop",
                    price: 50
                },
                { 
                    idCart: 2,
                    customer: "testUser",
                    paid: true,
                    paymentDate: "2024-04-21",
                    total: 100,
                    product: "testModel2",
                    cartQuantity: 1,
                    category: "Smartphone",
                    price: 50
                }
            ];
            callback(null, rows);
            return {} as Database
        });

        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-21");
       const cartDAO = new CartDAO();
        const result = await cartDAO.getPaidCart(user);

        // Assicuro che la funzione restituisca un array di carrelli
        expect(Array.isArray(result)).toBe(true);
        // Assicuro che ci siano due carrelli restituiti
        expect(result.length).toBe(2);
        // Assicuro che ogni elemento dell'array sia un oggetto di tipo Cart
    });

    

    test("It should reject with CartNotFoundError when no paid carts are found", async () => {
        const cartDAO = new CartDAO();
        const mockDBAll = jest.spyOn(testdb, "all").mockImplementation((sq, params, callback) => {
            callback(null, []); // Simula nessun carrello trovato (nessun carrello pagato
            return {} as Database
        });

        const user = new User("testUser", "Test", "User",Role.CUSTOMER, "Via Rossi 123", "2004-04-21");
       await expect(cartDAO.getPaidCart(user))
       .resolves.toEqual([]);

    });

    test("It should reject with an error on database failure", async () => {
        const cartDAO = new CartDAO();
        const mockDBAll = jest.spyOn(testdb, "all").mockImplementation((sq, params, callback)  => {
            callback(new Error("Database Error"), null); // Simulate database error
            return {} as Database
        });

        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-21");
       await expect(cartDAO.getPaidCart(user))
            .rejects
            .toThrow(new Error('Database Error'));

    });
});
//-------------------------------------------------
    describe('CartDAO.getUnPaidCart', () => {
        afterEach(() => {
            jest.clearAllMocks(); 
        });
    
        test("It should return a CartNotFoundError when there are no unpaid carts", async () => {
            const mockDBAll = jest.spyOn(testdb, "all").mockImplementation((sql, params, callback) => {
                callback(null, []); // Simula nessun carrello trovato
                return {} as Database;
            });
    
            const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-21");
           const cartDAO = new CartDAO();
            await expect(cartDAO.getUnpaidCart(user)).rejects.toThrow(cartErrors.CartNotFoundError);
        });
    
        test("It should reject with an error on database failure", async () => {
            const mockDBAll = jest.spyOn(testdb, "all").mockImplementation((sql, params, callback) => {
                callback(new Error('Database Error'), null);
                return {} as Database;
            });
    
            const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-21");
           const cartDAO = new CartDAO();
            await expect(cartDAO.getUnpaidCart(user)).rejects.toThrow('Database Error');

        });

    test("It should return the unpaid cart when found", async () => {
        // Simula il recupero di un carrello non pagato dal database
        const mockDBAll = jest.spyOn(testdb, "all").mockImplementation((sql, params, callback) => {
            const rows : Array<{
                customer: string,
                paid: boolean,
                paymentDate: string | null,
                total: number,
                product: string,
                cartQuantity: number,
                category: string,
                sellingPrice: number
            }> = [
                // Mock dei dati del carrello non pagato
                { 
                    customer: "testUser",
                    paid: false,
                    paymentDate: null,
                    total: 100,
                    product: "testProduct",
                    cartQuantity: 2,
                    category: "Appliance",
                    sellingPrice: 50
                }
            ];
            callback(null, rows);
            return {} as Database;
        });

        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-21");
       const cartDAO = new CartDAO();
        const unpaidCart = await cartDAO.getUnpaidCart(user);

        expect(unpaidCart.products.length).toBe(1);
        expect(unpaidCart.products[0]).toEqual({
            model: "testProduct",
            quantity: 2,
            category: "Appliance",
            price: 50
        });

    });
})
//-----------------------------------------------------------

describe('CartDAO.getUnPaidCartId', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("It should return null when there are no unpaid carts", async () => {
        const mockDBGet = jest.spyOn(testdb, "get").mockImplementation((sql, params, callback) => {
            callback(null, null); // Simula nessun carrello trovato
            return {} as Database;
        });

        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-21");
       const cartDAO = new CartDAO();
        const unpaidCartId = await cartDAO.getUnpaidCartId(user);
        expect(unpaidCartId).toBeNull();
    });

    test("It should return the cart ID when an unpaid cart exists", async () => {
        const mockDBGet = jest.spyOn(testdb, "get").mockImplementation((sql, params, callback) => {
            callback(null, { idCart: 42, // Simula carrello non pagato con ID 42
            customer: "testUser",
            paid: false,
            paymentDate: null,
            total: 100,
            product: "testModel",
            cartQuantity: 2,
            category: "Laptop",
            price: 50 }); 
            return {} as Database;
        });

        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-21");
       const cartDAO = new CartDAO();
        const unpaidCartId = await cartDAO.getUnpaidCartId(user);
        expect(unpaidCartId).toBe(42);
    });
})
//------------------------------------------------------------------------
describe('CartDAO.getEmptyCart', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("It should return an empty cart when the cart exists but has no products", async () => {
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rosssi 123", "2004-04-21");
        const emptyCart = new Cart( "testUser", false, " ", 0, [])
        const mockDBAll = jest.spyOn(testdb, "get").mockImplementation((sql, params, callback) => {
            callback(null, emptyCart);
            return {} as Database;
        });

       
        const cartDAO = new CartDAO();
        const cart = await cartDAO.getEmptyCart(user);

        expect(cart.total).toBe(0);
        expect(cart.products.length).toBe(0);
    });

    test("It should reject with CartNotFoundError if the cart does not exist", async () => {
        const productInCart = new ProductInCart("testModel", 2, Category.LAPTOP, 50);
        const mockDBAll = jest.spyOn(testdb, "get").mockImplementation((sql, params, callback) => {
            callback(null, undefined);
            return {} as Database;
        });

        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rosssi 123", "2004-04-21");
        const cartDAO = new CartDAO();
        await expect(cartDAO.getEmptyCart(user)).rejects.toThrow(cartErrors.CartNotFoundError);
    });
        
    test("It should reject with an error on database failure", async () => {
        const mockDBAll = jest.spyOn(testdb, "get").mockImplementation((sql, params, callback) => {
            callback(new Error('Database Error'), null);
            return {} as Database;
        });
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-21");
       const cartDAO = new CartDAO();
        await expect(cartDAO.getEmptyCart(user)).rejects.toThrow('Database Error');
    });
});

//-----------------------------------------------------
describe('CartDAO.getAllCarts', () => {
    afterEach(() => {
        jest.clearAllMocks(); 
    });

    test("It should return the list of all carts", async () => {
        // Simula il comportamento di testdb.all per restituire dati sui carrelli
        const mockDBAll = jest.spyOn(testdb, "all").mockImplementation((sql, callback) => {
            const rows = [
                // Dati di esempio per i carrelli
                { 
                    idCart: 1,
                    customer: "testUser",
                    paid: true,
                    paymentDate: "2024-04-21",
                    total: 100,
                    product: "testModel",
                    cartQuantity: 2,
                    category: "Laptop",
                    price: 50
                },
                { 
                    idCart: 2,
                    customer: "testUser",
                    paid: false,
                    paymentDate: null,
                    total: 50,
                    product: "testModel2",
                    cartQuantity: 1,
                    category: "Smartphone",
                    price: 50
                }
            ];
            callback(null, rows);
            return {} as Database;
        });

        const cartDAO = new CartDAO();
        const result = await cartDAO.getAllCarts();

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
    });

    test("It should return only one cart if the id is unique", async () => {
        const mockDBAll = jest.spyOn(testdb, "all").mockImplementation((sql, callback) => {
            const rows = [
                // Dati di esempio per i carrelli
                { 
                    idCart: 1,
                    customer: "testUser",
                    paid: true,
                    paymentDate: "2024-04-21",
                    total: 100,
                    product: "testModel",
                    cartQuantity: 2,
                    category: "Laptop",
                    price: 50
                },
                { 
                    idCart: 1, // Lo stesso idCart del precedente
                    customer: "testUser",
                    paid: true,
                    paymentDate: "2024-04-21",
                    total: 100,
                    product: "testModel2",
                    cartQuantity: 1,
                    category: "Smartphone",
                    price: 50
                }
            ];
            callback(null, rows);
            return {} as Database;
        });

        const cartDAO = new CartDAO();
        const result = await cartDAO.getAllCarts();

        expect(result.length).toBe(1);
        expect(result[0].products.length).toBe(2);
    });

    test("It should give error if there are not Carts", async () => {
        const cartDAO = new CartDAO();
        const mockDBAll = jest.spyOn(testdb, "all").mockImplementation((sql, callback) => {
            callback(new cartErrors.CartNotFoundError(), []); // Simula nessuna riga trovata
            return {} as Database;
        });

        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rosssi 123", "2004-04-21");
       await expect(cartDAO.getAllCarts()).rejects.toThrow(cartErrors.CartNotFoundError);
    });
    test("It should reject with an error on database failure", async () => {
        const mockDBAll = jest.spyOn(testdb, "all").mockImplementation((sql, callback) => {
            callback(new Error('Database Error'), null);
            return {} as Database;
        });
       const cartDAO = new CartDAO();
        await expect(cartDAO.getAllCarts()).rejects.toThrow('Database Error');
    });
});


describe('CartDAO.changeProductNumberInCart', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("It should increment the product quantity in the cart", async () => {
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-24");
        const cartDAO = new CartDAO();

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementation((sql, params, callback) => {
            callback.call({changes:1},null);
            return {} as any;
        });
        const result = await cartDAO.changeProductNumberInCart("testProduct",1, "increment");

        expect(result).toBe(true);
        expect(mockDBRun).toHaveBeenCalledWith(
            "UPDATE cartProducts SET cartQuantity = cartQuantity + 1 WHERE idCart = ? AND product = ?",
            [1, "testProduct"],
            expect.any(Function)
        );
    });
    
    test("It should decrement the product quantity in the cart", async () => {
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-24");
        const cartDAO = new CartDAO();

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementation((sql, params, callback) => {
            callback.call({changes:1},null);
            return {} as any;
        });
        const mockUpdateTotalCart = jest.spyOn(cartDAO, "updateTotalCart").mockResolvedValue(true);

        const result = await cartDAO.changeProductNumberInCart("testProduct", 1, "decrement");

        expect(result).toBe(true);
        expect(mockDBRun).toHaveBeenCalledWith(
            "UPDATE cartProducts SET cartQuantity = cartQuantity - 1 WHERE idCart = ? AND product = ?",
            [1, "testProduct"],
            expect.any(Function)
        );

    });


    test("It should reject with an error for an invalid operation", async () => {
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-24");
        const cartDAO = new CartDAO();

        await expect(cartDAO.changeProductNumberInCart("testProduct",1, "invalidOperation")).rejects.toThrow(new Error("Invalid operation"));
    });
    
    test("It should reject with a database error", async () => {
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-24");
        const cartDAO = new CartDAO();

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Database Error"),undefined);
            return {} as any;
        });

        await expect(cartDAO.changeProductNumberInCart("testProduct",1, "increment")).rejects.toThrow("Database Error");

    });

    test("It should fail with ProductNotInCartError if the product is not in the the cart", async () => {
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-24");
        const cartDAO = new CartDAO();

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementation((sql, params, callback) => {
            callback.call({changes:0},null);
            return {} as any;
        });

        await expect(cartDAO.changeProductNumberInCart("testProduct",1, "increment")).rejects.toThrow(cartErrors.ProductNotInCartError);
    })

});

//------------------------------------------------------------

describe('CartDAO.ManageProductToCart', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("It should insert a product in the cart", async () => {
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-24");
        const cartDAO = new CartDAO();

      
        const mockDBRun = jest.spyOn(testdb, "run").mockImplementation((sql, params, callback) => {
            callback.call({changes:1},null);
            return {} as any;
        });
        

        const result = await cartDAO.ManageProductToCart("testProduct",1, "insert");

        expect(result).toBe(true);
        expect(mockDBRun).toHaveBeenCalledWith(
            "INSERT INTO cartProducts (idCart, product, cartQuantity) VALUES (?, ?, 1)",
            [1, "testProduct"],
            expect.any(Function)
        );
    });
    
    test("It should delete the product in the cart", async () => {
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-24");
        const cartDAO = new CartDAO();

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementation((sql, params, callback) => {
            callback.call({changes:1},null);
            return {} as any;
        });

        const result = await cartDAO.ManageProductToCart("testProduct",1, "delete");

        expect(result).toBe(true);
        expect(mockDBRun).toHaveBeenCalledWith(
            "DELETE FROM cartProducts WHERE idCart = ? AND product = ?",
            [1, "testProduct"],
            expect.any(Function)
        );
    });

    test("It should reject with an error for an invalid operation", async () => {
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-24");
        const cartDAO = new CartDAO();

        await expect(cartDAO.ManageProductToCart("testProduct",1, "invalidOperation")).rejects.toThrow(new Error("Invalid operation"));
    });
    
    test("It should reject with a database error", async () => {
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-24");
        const cartDAO = new CartDAO();

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Database Error"),undefined);
            return {} as any;
        });

        await expect(cartDAO.ManageProductToCart("testProduct", 1, "delete")).rejects.toThrow("Database Error");;
    });

    test("It should fail with ProductNotInCartError if the product is not in the the cart", async () => {
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-24");
        const cartDAO = new CartDAO();

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementation((sql, params, callback) => {
            callback.call({changes:0},null);
            return {} as any;
        });

        await expect(cartDAO.ManageProductToCart("testProduct",1, "delete")).rejects.toThrow(cartErrors.ProductNotInCartError);
    })
});

//------------------------------------------------------------

describe('CartDAO.updateTotalCart', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("It should update the total of the cart successfully", async () => {
        const cartDAO = new CartDAO();

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementation((sql, params, callback) => {
            callback.call({changes:1},null);
            return {} as any;
        });

        const result = await cartDAO.updateTotalCart(1);

        expect(result).toBe(true);
        expect(mockDBRun).toHaveBeenCalledWith(
            `
                UPDATE carts 
                SET total = (
                    SELECT COALESCE(SUM(cartQuantity * sellingPrice), 0) 
                    FROM cartProducts 
                    INNER JOIN products ON cartProducts.product = products.model
                    WHERE idCart = ?
                ) 
                WHERE idCart = ?`,
            [1, 1],
            expect.any(Function)
        );

    });

    test("It should reject with an error during the update", async () => {
        const cartDAO = new CartDAO();

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementation((sql, params, callback) => {
            callback(new cartErrors.CartNotFoundError(),undefined);
            return {} as any;
        });

        await expect(cartDAO.updateTotalCart(1)).rejects.toThrow(cartErrors.CartNotFoundError);
    });

    test("It should reject with CartndError during the update", async () => {
        const cartDAO = new CartDAO();

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementation((sql, params, callback) => {
            callback.call({changes:0},null);
            return {} as any;
        });

        await expect(cartDAO.updateTotalCart(1)).rejects.toThrow(new cartErrors.CartNotFoundError());
    })
});
//-------------------------------------------------------------------
describe('CartDAO.checkoutCart', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("It should checkout the cart successfully", async () => {
        const cartDAO = new CartDAO();
        
        // Mock della data attuale
        const currentDate = "2023-06-01";
        const mockDayjs = jest.spyOn(dayjs.prototype, "format").mockReturnValue(currentDate);

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementation((sql, params, callback) => {
            callback.call({changes:1},null);
            return {} as any;
        });

        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-24");
        const result = await cartDAO.checkoutCart(user);

        expect(result).toBe(true);
        expect(mockDBRun).toHaveBeenCalledWith(`
                UPDATE carts 
                SET paid = ?, paymentDate = ? 
                WHERE customer = ? 
                AND paid = ? 
                AND EXISTS (
                    SELECT 1 FROM cartProducts WHERE cartProducts.idCart = carts.idCart
                )`,
            [true, currentDate, user.username, false],
            expect.any(Function)
        );

    });

    test("It should reject with an error during checkout", async () => {
        const cartDAO = new CartDAO();

        // Mock della data attuale
        const currentDate = "2023-06-01";
        const mockDayjs = jest.spyOn(dayjs.prototype, "format").mockReturnValue(currentDate);

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Checkout failed"),undefined);
            return {} as any;
        });

        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-24");
        await expect(cartDAO.checkoutCart(user)).rejects.toThrow(new Error("Checkout failed"));

    });

    test("It should reject with an EmptyCartError if the cart is empty", async () => {
        const cartDAO = new CartDAO();

        // Mock della data attuale
        const currentDate = "2023-06-01";
        const mockDayjs = jest.spyOn(dayjs.prototype, "format").mockReturnValue(currentDate);

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementation((sql, params, callback) => {
            callback.call({changes:0},null);
            return {} as any;
        });

        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-24");
        await expect(cartDAO.checkoutCart(user)).rejects.toThrow(cartErrors.EmptyCartError);
    })
});
//-------------------------------------------------------------------
describe('CartDAO.clearUnpaidCart', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("It should clear the unpaid cart successfully", async () => {
        const cartDAO = new CartDAO();

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementation((sql, params, callback) => {
            callback.call({changes:1},null);
            return {} as any;
        });

        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-24");
        const result = await cartDAO.clearUnpaidCart(1);

        expect(result).toBe(true);
  
        expect(mockDBRun).toHaveBeenCalledWith("DELETE FROM cartProducts WHERE idCart = ?", [1], expect.any(Function));


    });

    test("It should reject with an error during clearing unpaid cart", async () => {
        const cartDAO = new CartDAO();

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Database Error"),undefined);
            return {} as any;
        });

        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-24");
        await expect(cartDAO.clearUnpaidCart(1)).rejects.toThrow(new Error("Database Error"));

    });

    test("It should reject with CartNotFoundError if the cart is empty", async () => {
        const cartDAO = new CartDAO();

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementation((sql, params, callback) => {
            callback.call({changes:0},null);
            return {} as any;
        });

        await expect(cartDAO.clearUnpaidCart(1)).rejects.toThrow(cartErrors.CartNotFoundError);
    });
});
//-------------------------------------------------------------------
describe('CartDAO.deleteAllCarts', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("It should delete all carts successfully", async () => {
        const cartDAO = new CartDAO();

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementation((sql, callback) => {
            callback.call({changes:1},null);
            return {} as any;
        });

        const result = await cartDAO.deleteAllCarts();

        expect(result).toBe(true);
        expect(mockDBRun).toHaveBeenCalledTimes(2);
        expect(mockDBRun).toHaveBeenNthCalledWith(1, "DELETE FROM cartProducts", expect.any(Function));
        expect(mockDBRun).toHaveBeenNthCalledWith(2, "DELETE FROM carts", expect.any(Function));

    });

    test("It should reject with an error during deleting all carts", async () => {
        const cartDAO = new CartDAO();

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementation((sql, callback) => {
            callback(new Error(),undefined);
            return {} as any;
        });

        await expect(cartDAO.deleteAllCarts()).rejects.toThrow(new Error());

        expect(mockDBRun).toHaveBeenCalledWith("DELETE FROM cartProducts", expect.any(Function));

    });

    test("It should reject with an error during deleting all carts when deleting carts fails", async () => {
        const cartDAO = new CartDAO();

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementationOnce((sql, callback) => {
            callback.call({changes:1},null);
            return {} as any;
        }).mockImplementationOnce((sql, callback) => {
            callback(new Error(),undefined);
            return {} as any;
        });

        await expect(cartDAO.deleteAllCarts()).rejects.toThrow(new Error());

        expect(mockDBRun).toHaveBeenCalledTimes(2);
        expect(mockDBRun).toHaveBeenNthCalledWith(1, "DELETE FROM cartProducts", expect.any(Function));
        expect(mockDBRun).toHaveBeenNthCalledWith(2, "DELETE FROM carts", expect.any(Function));

    });

    test("It should reject with CartNotFoundError during deleting all products", async()=>{
        const cartDAO = new CartDAO();

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementationOnce((sql, callback) => {
            callback.call({changes:0},null);
            return {} as any;
        });

        await expect(cartDAO.deleteAllCarts()).rejects.toThrow(cartErrors.CartNotFoundError);

        expect(mockDBRun).toHaveBeenCalledWith("DELETE FROM cartProducts", expect.any(Function));
    })

    test("It should reject with CartNotFoundError during deleting all carts", async()=>{
        const cartDAO = new CartDAO();

        const mockDBRun = jest.spyOn(testdb, "run").mockImplementationOnce((sql, callback) => {
            callback.call({changes:1},null);
            return {} as any;
        }).mockImplementationOnce((sql, callback) => {
            callback.call({changes:0},null);
            return {} as any;
        });

        await expect(cartDAO.deleteAllCarts()).rejects.toThrow(cartErrors.CartNotFoundError);

        expect(mockDBRun).toHaveBeenCalledTimes(2);
        expect(mockDBRun).toHaveBeenNthCalledWith(1, "DELETE FROM cartProducts", expect.any(Function));
        expect(mockDBRun).toHaveBeenNthCalledWith(2, "DELETE FROM carts", expect.any(Function));
    })
});