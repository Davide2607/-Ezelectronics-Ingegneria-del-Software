import { Cart } from "../components/cart";
import { User } from "../components/user";
import CartDAO from "../dao/cartDAO";
import ProductDAO from "../dao/productDAO";
import * as cartErrors from "../errors/cartError"
import * as productErrors from "../errors/productError"
import dayjs from "dayjs";


/**
 * Represents a controller for managing shopping carts.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class CartController {
    private dao: CartDAO
    private productDAO: ProductDAO;
  
    constructor() {
        this.dao = new CartDAO
        this.productDAO = new ProductDAO
    }

    /**
     * Adds a product to the user's cart. If the product is already in the cart, the quantity should be increased by 1.
     * If the product is not in the cart, it should be added with a quantity of 1.
     * If there is no current unpaid cart in the database, then a new cart should be created.
     * @param user - The user to whom the product should be added.
     * @param productId - The model of the product to add.
     * @returns A Promise that resolves to `true` if the product was successfully added.
     */
    async addToCart(user: User, product: string) : Promise<Boolean> { 
        
        let cart
        const product_value = await this.productDAO.getProducts("model", null, product)
        try{
            cart = await this.dao.getUnpaidCart(user);
        }catch(error){
            try{
                cart = await this.dao.getEmptyCart(user);
            }catch(error){
                return this.dao.createCart(user, product_value[0]);
                
            }
        }
    
        const productExists = cart.products.find(p => p.model === product);
        const idCart = await this.dao.getUnpaidCartId(user)
    
        if (productExists) {
            try {
                await this.dao.changeProductNumberInCart(product, idCart, "increment");
                return this.dao.updateTotalCart(idCart);
            } catch (error) {
                throw error;
            }
        } else {
            try{
                await this.dao.ManageProductToCart(product,idCart, "insert");
                return this.dao.updateTotalCart(idCart);
            }catch(error){
                throw error;
            }
        }
                      
    }


    /**
     * Retrieves the current cart for a specific user.
     * @param user - The user for whom to retrieve the cart.
     * @returns A Promise that resolves to the user's cart or an empty one if there is no current cart.
     */
    async getCart(user: User) : Promise<Cart> { 
        try{
            return await this.dao.getUnpaidCart(user)
        }catch(error){
            try{
                return await this.dao.createEmptyCart(user)
            }catch(error){
                throw error;
            }
        }

    }

    /**
     * Checks out the user's cart. We assume that payment is always successful, there is no need to implement anything related to payment.
     * @param user - The user whose cart should be checked out.
     * @returns A Promise that resolves to `true` if the cart was successfully checked out.
     * 
     */
    async checkoutCart(user: User) : Promise<Boolean> { 
        let cart
        try {
            cart = await this.getCart(user);
        } catch (error) {
            throw error;
        }

        const result = await this.dao.checkoutCart(user);

        // Check if all products in the cart are available in the required quantity
        for (let product of cart.products) {
            
            const productData = await this.productDAO.getProducts("model", null, product.model);
            if (productData[0].quantity < product.quantity) {
                throw new productErrors.LowProductStockError();
            }
            await this.productDAO.changeProductQuantity(product.model,-product.quantity,dayjs().format("YYYY-MM-DD"))
            .catch((error) => {
                throw new Error("Quantity not updated")
            })
        }

        return result
               

        
}

    /**
     * Retrieves all paid carts for a specific customer.
     * @param user - The customer for whom to retrieve the carts.
     * @returns A Promise that resolves to an array of carts belonging to the customer.
     * Only the carts that have been checked out should be returned, the current cart should not be included in the result.
     */
    async getCustomerCarts(user: User) :Promise<Cart[]> { 
        return this.dao.getPaidCart(user)
    } 

    /**
     * Removes one product unit from the current cart. In case there is more than one unit in the cart, only one should be removed.
     * @param user The user who owns the cart.
     * @param product The model of the product to remove.
     * @returns A Promise that resolves to `true` if the product was successfully removed.
     */
    async removeProductFromCart(user: User, product: string): Promise<boolean> { 
        let cart
        try{
          cart = await this.dao.getUnpaidCart(user);
        } catch(error){
            throw error;
        }
        
        const idCart = await this.dao.getUnpaidCartId(user)
        const productInCart = cart.products.find(p => p.model === product);
    
        if (!productInCart){
            throw new cartErrors.EmptyCartError();
        }
    
        if (productInCart.quantity > 1) {
            try {
                await this.dao.changeProductNumberInCart(product, idCart, "decrement");
                return this.dao.updateTotalCart(idCart);
            } catch (error) {
                throw error;
            }
        } else {
            try{
                await this.dao.ManageProductToCart(product,idCart, "delete");
                return this.dao.updateTotalCart(idCart);
            }catch(error){
                throw error;
            }
        }
    
    }


    /**
     * Removes all products from the current cart.
     * @param user - The user who owns the cart.
     * @returns A Promise that resolves to `true` if the cart was successfully cleared.
     */
    async clearCart(user: User) :Promise<boolean> { 
        let cart
        try{
          cart = await this.dao.getUnpaidCart(user);
        } catch(error){
            throw error;
        }

        const idCart = await this.dao.getUnpaidCartId(user)
        try{
           for (let prod in cart.products){
            const number = await this.productDAO.changeProductQuantity(cart.products[prod].model, +1, null)
           }
        }catch(error){
            throw new Error("Quantity not updated")
          }
        
        try{
            await this.dao.clearUnpaidCart(idCart);
            return this.dao.updateTotalCart(idCart);
        }catch(error){
            throw error;
        }
    }

    /**
     * Deletes all carts of all users.
     * @returns A Promise that resolves to `true` if all carts were successfully deleted.
     */
    async deleteAllCarts(): Promise<Boolean>{
        return this.dao.deleteAllCarts()
     }

    /**
     * Retrieves all carts in the database.
     * @returns A Promise that resolves to an array of carts.
     */
    async getAllCarts() :Promise<Cart[]>  { 
         return this.dao.getAllCarts()
    }
}

export default CartController