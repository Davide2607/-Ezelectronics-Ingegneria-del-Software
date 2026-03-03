import db from "../db/db"
import {Category, Product } from "../components/product"
import { ProductAlreadyExistsError, ProductNotFoundError, LowProductStockError, EmptyProductStockError } from "../errors/productError";
/**
 * A class that implements the interaction with the database for all product-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */  


class ProductDAO {

 
    /**
     * Registers a new product concept (model, with quantity defining the number of units available) in the database.
     * @param model The unique model of the product.
     * @param category The category of the product.
     * @param quantity The number of units of the new product.
     * @param details The optional details of the product.
     * @param sellingPrice The price at which one unit of the product is sold.
     * @param arrivalDate The optional date in which the product arrived.
     * @returns A Promise that resolves to nothing.
     */

    registerProducts(model: string, category: string, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        try { 
            const sql = 
            "INSERT INTO products (model, sellingPrice, category, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)"
            db.run(sql, [model, sellingPrice , category, arrivalDate, details , quantity], (err: Error | null, row: any) => {
                if (err) {    //UPDATED   
                      
                    if (err.message.includes("UNIQUE constraint failed: products.model")) 
                      reject(new ProductAlreadyExistsError());

                    reject(err)
                } else
                resolve()
            }
        )
        } catch (error) {
            reject(error)
        }

    });
}

/**
* Increases the available quantity of a product through the addition of new units.
* @param model The model of the product to increase.
* @param newQuantity The number of product units to add. This number must be added to the existing quantity, it is not a new total.
* @param changeDate The optional date in which the change occurred.
* @returns A Promise that resolves to the new available quantity of the product.
*/


changeProductQuantity(model: string, newQuantity: number, changeDate: string | null): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      //  Fetch the old quantity
      const fetchSql = "SELECT quantity FROM products WHERE model = ?";
      db.get(fetchSql, [model], (fetchErr: Error | null, row: { quantity: number }) => {
        if (fetchErr) {
          return reject(fetchErr);
        }
        if (row == undefined) { //UPDATED
          return reject(new ProductNotFoundError());
        }

        const oldQuantity = row.quantity;
        const updatedQuantity = oldQuantity + newQuantity;

        //  Update the quantity
        const updateSql = "UPDATE products SET quantity = ? WHERE model = ?";
        db.run(updateSql, [updatedQuantity,model], (updateErr: Error | null)  => {
          if (updateErr) {
            return reject(updateErr);
          } else {
            resolve(updatedQuantity);
          }
        });
      });
    });
  }


/**
     * Decreases the available quantity of a product through the sale of units.
     * @param model The model of the product to sell
     * @param quantity The number of product units that were sold.
     * @param sellingDate The optional date in which the sale occurred.
     * @returns A Promise that resolves to the new available quantity of the product.
     */
sellProduct(model: string, quantity: number, sellingDate: string | null): Promise<number> { 
    return new Promise<number>((resolve, reject) => {
        const checkQuantitySql = "SELECT quantity FROM products WHERE model=?";

        const sql = "UPDATE products SET quantity=quantity-? WHERE model=?";
        db.get(checkQuantitySql, [model], (err: Error | null, row: any) => {
            if (err) {
                reject(err);
            } else if (row == undefined) { //UPDATED
                reject(new ProductNotFoundError());
            } else if (row.quantity === 0) {
                reject(new EmptyProductStockError());
            } else if (row.quantity < quantity) {
                reject(new LowProductStockError());
            } else {
            
                db.run(sql, [quantity, model], function(err: Error | null) { 
                    if (err) {
                        reject(err);
                    } else {
                        let newQuantity=row.quantity-quantity;
                        resolve(newQuantity);
                    }
                });
            }
        });
       
    });
}

 /**
     * Returns all products in the database, with the option to filter them by category or model.
     * @param grouping An optional parameter. If present, it can be either "category" or "model".
     * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
     * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
     * @returns A Promise that resolves to an array of Product objects.
     */
  getProducts(grouping: string | null, category: string | null, model: string | null): Promise<Product[]> { 
    return new Promise<Product[]>((resolve, reject) => {
        try {

            let query = "SELECT * FROM products";
            const params: string[] = [];
            
            if (grouping === "category" && category) {
              query += " WHERE category = ?";
              params.push(category);
            } else if (grouping === "model" && model) {
              query += " WHERE model = ?";
              params.push(model);
            }
          //UPDATED
       db.all(query, params, (err: Error | null, rows: any) => {
            if (err) {

                reject(err)
            }
            else if (rows.length === 0) {
                
                resolve([])
            }
            else{

              const products = rows.map((row: any) => new Product( 
                row.sellingPrice,
                row.model,
                row.category,
                row.arrivalDate,
                row.details,
                row.quantity));
              resolve(products);
            }
        })
    } catch (error) {
      
        reject(error)
    }
       
    });
}

getAvailableProducts(grouping: string | null, category: string | null, model: string | null): Promise<Product[]>  {
    return new Promise<Product[]>((resolve, reject) => {

      try {
        let query = "SELECT * FROM products WHERE quantity>0 ";
        const params: string[] = [];

        if (grouping === "category" && category) {
          query += " AND category = ? ";
          params.push(category);
        } else if (grouping === "model" && model) {
          query += "AND model = ? ";
          
          params.push(model);
        } 
      
        db.all(query, params, (err: Error | null, rows: any) => {
            if (err) {
              reject(err)
            }
            else if (rows.length === 0) {
              resolve([])
            }
            else{ 
              const products = rows.map((row: any) => new Product( 
              row.sellingPrice,
              row.model,
              row.category,
              row.arrivalDate,
              row.details,
              row.quantity));
            resolve(products);
          } 
        })
      } catch (error) {
          reject(error)
      }
      })
    }


 deleteAllProducts():Promise<Boolean>  {
  return new Promise<Boolean>((resolve, reject) => {
    try { 
        const sql = 
        "DELETE FROM products"
        db.run(sql, function (err: Error | null) { //UPDATED
          if (err) {
            reject(err); 
          } else if(this.changes === 0){
             return reject(new EmptyProductStockError());
          } else{
             resolve(true);
          }
      }
    )
    } catch (error) {
      reject(error)
    }

});
     
 }

 
deleteProduct(model: string): Promise<Boolean>{
  return new Promise<Boolean>((resolve, reject) => {
    try { 
        const sql = 
      "DELETE FROM products WHERE model=?"
        db.run(sql, [model], function (err: Error | null) {
            if (err) {
                reject(err);
             } else if (this.changes == 0) {
                return reject(new ProductNotFoundError());
             } else
               resolve(true);
        }
      )
      } catch (error) {
        reject(error)
    }

});

}








}

export default ProductDAO