import db from "../db/db"
import {Cart, ProductInCart} from "../components/cart"
import {Category, Product} from "../components/product"
import { User } from "../components/user";
import * as cartErrors from "../errors/cartError"
import dayjs from "dayjs"

/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class CartDAO {
 
        
    createCart(user: User, productModel: Product): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const sqlCart = "INSERT INTO carts (idCart, customer, paid, paymentDate, total) VALUES (?, ?, ?, ?, ?)";
                db.run(sqlCart, [null, user.username, 0, null, productModel.sellingPrice], function(err: Error | null, row:any) {
                    if (err) {
                        
                        reject(err);
                    } else {
                        const id = this.lastID;
                        const sqlCartProduct = "INSERT INTO cartProducts (idCart, product, cartQuantity) VALUES (?, ?, ?)";
                        db.run(sqlCartProduct, [id, productModel.model, 1], (err: Error | null) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(true);
                            }
                        });
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    createEmptyCart(user: User): Promise<Cart> {
        return new Promise<Cart>((resolve, reject) => {
            const sql = "INSERT INTO carts (idCart, customer, paid, paymentDate, total) VALUES (?,?, ?, ?, ?)";
            db.run(sql, [null, user.username, false, null, 0], function(err: Error | null) {
                if (err) {
                    reject(err);
                } else {
                    const cart = new Cart(user.username, false, null, 0, []);
                    resolve(cart);
                }
            });
        });
    }

    getPaidCart(user: User): Promise<Cart[]>  {
        // Returns a list of paid carts by the user
        return new Promise<Cart[]>((resolve, reject) => {
            const sql = `
            SELECT carts.*, cartProducts.product, cartProducts.cartQuantity, products.category, products.sellingPrice
            FROM carts 
            INNER JOIN cartProducts ON carts.idCart = cartProducts.idCart 
            INNER JOIN products ON cartProducts.product = products.model
            WHERE carts.customer = ? AND carts.paid = ?`
            db.all(sql, [user.username, true], (err: Error | null, rows: any[]) => {
                if (err) {
                    reject(err);
                } else if (rows.length === 0) {
                    resolve([])
                } else {
                    let carts: Cart[] = [];
                    let cartMap: { [id: string]: Cart } = {};
    
                    rows.forEach(row => {
                        let product = {model: row.product, quantity: row.cartQuantity, category:row.category, price:row.price};
                        if (cartMap[row.idCart]) {
                            cartMap[row.idCart].products.push(product);
                        } else {
                            let cart = new Cart(row.customer, row.paid, row.paymentDate, row.total, [product]);
                            cartMap[row.idCart] = cart;
                            carts.push(cart);
                        }
                    });
    
                    resolve(carts);
                }
            });
        })
    }

    getUnpaidCart(user: User): Promise<Cart> {
        // Returns the unpaid cart of the user
        return new Promise<Cart>((resolve, reject) => {
            const sql = `
                SELECT carts.*, cartProducts.product, cartProducts.cartQuantity, products.category, products.sellingPrice
                FROM carts
                INNER JOIN cartProducts ON carts.idCart = cartProducts.idCart  
                INNER JOIN products ON cartProducts.product = products.model
                WHERE carts.customer = ? AND carts.paid = ?`
            db.all(sql, [user.username, false], (err: Error| null, rows: any[]) => {
                if (err) {
                    reject(err);
                    return;
                }
                 else if (rows.length === 0) {
                    reject(new cartErrors.CartNotFoundError());
                }  else {
                     const products = rows.map(row => ({model: row.product, quantity: row.cartQuantity, category:row.category, price:row.sellingPrice}));
                     const cart = new Cart(rows[0].customer, rows[0].paid, rows[0].paymentDate, rows[0].total, products);
                     resolve(cart);
                    }
            });
        })
    }

    getUnpaidCartId(user: User): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            const sqlGetCart = "SELECT idCart FROM carts WHERE customer = ? AND paid = ?";
            db.get(sqlGetCart, [user.username, false], (err: Error | null, row: any) => { 
                if (err) {
                    reject(err)
                }  else if (!row) {
                     resolve(null)
                    }     else { 
                           resolve(row.idCart);
                          }
            });
        });
    }

    getEmptyCart(user: User): Promise<Cart> {
        return new Promise<Cart>((resolve, reject) => {
            const sql = `SELECT * FROM carts WHERE customer = ? AND paid = ? `
            db.get(sql, [user.username, false], (err: Error | null, rows: any) => {
                if (err) {
                    reject(err);
                } else if (rows === undefined) {
                    reject(new cartErrors.CartNotFoundError());
                    return;
                } else {
                    const product:ProductInCart[] = []
                    const cart = new Cart(rows.customer, rows.paid, rows.paymentDate, rows.total, product);
                    resolve(cart);
                }
            });
        })
    }


    getAllCarts(): Promise<Cart[]> {
        // Returns a list with all carts
        return new Promise<Cart[]>((resolve, reject) => {
            const sql = `
                SELECT carts.*, cartProducts.product, cartProducts.cartQuantity, products.category, products.sellingPrice
                FROM carts 
                LEFT JOIN cartProducts ON carts.idCart = cartProducts.idCart
                INNER JOIN products ON cartProducts.product = products.model`   
            db.all(sql,(err: Error | null, rows: any[]) => {
                if (err) {
                    reject(err);
                } else if (rows.length === 0) {
                    resolve([])
                } else {
                    const cartsMap = new Map();
                    rows.forEach(row => {
                        if (!cartsMap.has(row.idCart)) {
                            cartsMap.set(row.idCart, new Cart(row.customer, row.paid, row.paymentDate, row.total, []));
                        }
                        cartsMap.get(row.idCart).products.push({product: row.product, quantity: row.cartQuantity, category: row.category, price: row.sellingPrice});
                    });
                    resolve(Array.from(cartsMap.values()));
                }
            });
        })
    }

    changeProductNumberInCart(product: string, idCart: number, operation: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
                let sqlUpdateProduct;
                if (operation === 'increment') {
                    sqlUpdateProduct = "UPDATE cartProducts SET cartQuantity = cartQuantity + 1 WHERE idCart = ? AND product = ?";
                } else if (operation === 'decrement') {
                    sqlUpdateProduct = "UPDATE cartProducts SET cartQuantity = cartQuantity - 1 WHERE idCart = ? AND product = ?";
                } else {
                    reject(new Error("Invalid operation"));
                    return;
                }
                db.run(sqlUpdateProduct, [idCart, product], function(err: Error | null) {
                    if (err) {
                        reject(err);
                    } else if(this.changes == 0) {
                        reject(new cartErrors.ProductNotInCartError());                     
                    } else {
                        resolve(true)
                    }
                });
            });
    }

    updateTotalCart(idCart: number): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const sqlUpdateTotal = `
                UPDATE carts 
                SET total = (
                    SELECT COALESCE(SUM(cartQuantity * sellingPrice), 0) 
                    FROM cartProducts 
                    INNER JOIN products ON cartProducts.product = products.model
                    WHERE idCart = ?
                ) 
                WHERE idCart = ?`;
                db.run(sqlUpdateTotal, [idCart, idCart], function(err: Error | null) {
                    if (err) {
                        reject(err);
                    } else if (this.changes == 0 ) {
                        reject(new cartErrors.CartNotFoundError());
                    }
                    else {
                        resolve(true);
                    }
                });
        });
    }

    ManageProductToCart(product: string, idCart:number, operation: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
                let sqlManageProduct;
                if (operation === 'insert') {
                    sqlManageProduct = "INSERT INTO cartProducts (idCart, product, cartQuantity) VALUES (?, ?, 1)";
                } else if (operation === 'delete') {
                    sqlManageProduct = "DELETE FROM cartProducts WHERE idCart = ? AND product = ?";
                } else {
                    reject(new Error("Invalid operation"));
                    return;
                }
                db.run(sqlManageProduct, [idCart, product], function(err: Error | null){
                    if (err) {
                        reject(err);
                    } 
                    else if(this.changes == 0) {
                        reject(new cartErrors.ProductNotInCartError());
                    }
                    else {
                        resolve(true)
                    }
                });
            })
    }
    
    checkoutCart(user: User): Promise<boolean> {
        //Imposta a true il boolean del paid
        //Inserisce la paymentDate a quella di oggi

        return new Promise<boolean>((resolve, reject) => {
            const sql = `
                UPDATE carts 
                SET paid = ?, paymentDate = ? 
                WHERE customer = ? 
                AND paid = ? 
                AND EXISTS (
                    SELECT 1 FROM cartProducts WHERE cartProducts.idCart = carts.idCart
                )`;
            const currentDate = dayjs().format("YYYY-MM-DD")
            db.run(sql, [true, currentDate, user.username, false], function (err: Error | null) {
                if (err) {
                    reject(err);
                } else if (this.changes == 0) {
                    reject(new cartErrors.EmptyCartError());
                }
                else {
                    resolve(true);
                }
            });
        });
       
    }

    clearUnpaidCart(idCart: number): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const sqlDeleteProducts = 
                "DELETE FROM cartProducts WHERE idCart = ?";
            db.run(sqlDeleteProducts, [idCart], function(err: Error | null) {
                if (err) {
                    reject(err);
                } else if(this.changes == 0) {
                    reject(new cartErrors.CartNotFoundError());
                }
                else {
                    resolve(true)
                }
            });
        })
    }

    

    deleteAllCarts(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const sqlDeleteCartProducts = "DELETE FROM cartProducts";
            db.run(sqlDeleteCartProducts, function(err: Error | null){
                if (err) {
                    reject(err);
                } else if(this.changes == 0) {
                    reject(new cartErrors.CartNotFoundError());
                }
                else {
                    const sqlDeleteCarts = "DELETE FROM carts";
                    db.run(sqlDeleteCarts, function(err: Error | null){
                        if (err) {
                            reject(err);
                        } else if(this.changes == 0) {
                            reject(new cartErrors.CartNotFoundError());
                        }
                        else {
                            resolve(true);
                        }
                    });
                }
            });
        });
    }

    
    
    
    

    
    

    

}

export default CartDAO