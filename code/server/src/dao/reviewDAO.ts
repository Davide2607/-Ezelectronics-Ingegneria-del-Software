
import db from "../db/db"
import { ProductReview } from "../components/review";
import { ExistingReviewError, NoReviewProductError } from "../errors/reviewError";
import { User } from "../components/user"
import dayjs from "dayjs";

/**
 * A class that implements the interaction with the database for all review-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ReviewDAO {

    addReview(model: string, user: User, score: number, comment: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try{
            const currentDate = dayjs().format('YYYY-MM-DD');
            const Sql = "INSERT INTO productReview(model, user, score, date, comment) VALUES(?, ?, ?, ?, ?)";

            db.run(Sql, [model, user.username, score, currentDate, comment], (err: Error | null) => {
                    if (err){
                        reject(err)
                }
                resolve();
            })
          }catch(error){
            reject(error)
          }
        })
    }

    getProductReviews(model: string): Promise<ProductReview[]> {
        return new Promise<ProductReview[]>((resolve, reject) => {
            try{
            const Sql = "SELECT * FROM productReview WHERE model = ?";
            db.all(Sql, [model], (err: Error | null, rows: any[]) => {
                if (err) {
                    reject(err);
                }
                else if(rows.length===0){
                    resolve([])
                    return
                }
                else{
                    const reviews = rows.map(row => new ProductReview(row.model, row.user, row.score, row.date, row.comment));
                    resolve(reviews)
                }
            });
        }catch(error){
            reject(error)
        }
        });
    }
    
    getUserReview(user: User, model:string): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            const Sql = "SELECT * FROM productReview WHERE model = ? AND user = ?";
            db.all(Sql, [model, user.username], (err: Error | null, rows: any[]) => {
                if (err) {
                    reject(err);
                    return;
                }
                else if(rows.length===0){
                    resolve(false)
                }
                else{
                    resolve(true)
                }
            });
        });
    }
               
    deleteReview(model: string, user: User): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const deleteReviewSql = "DELETE FROM productReview WHERE model = ? AND user = ?";
                db.run(deleteReviewSql, [model, user.username], function (err: Error | null) {
                    if (err) 
                        reject (err);
                    else if (this.changes===0) 
                        reject(new NoReviewProductError());
                
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    deleteReviewsOfProduct(model: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const deleteReviewsSql = "DELETE FROM productReview WHERE model = ?";
                db.run(deleteReviewsSql, [model], function (err: Error | null) {
                    if (err) 
                        reject (err);
                    else if (this.changes===0) 
                        reject(new NoReviewProductError());
                    
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    deleteAllReviews() :Promise<void>  { 
        return new Promise<void>((resolve,reject)=>{
            try{
             const sql = "DELETE FROM productReview"
             db.run(sql,function (err: Error | null) {
                if (err) 
                    reject (err);
                resolve();
            });
            }
            catch(error){
             reject(error)
            }
         })
    }


}


export default ReviewDAO;