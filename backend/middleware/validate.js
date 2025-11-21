
export const validate = (schema) => (req, res, next ) => {
    try {
        const parse = schema.parse(req.body);
        req.body = parse ; 
        next() ;
    }catch (err) {
        if ( err.errors ){
            return res.status(400).json({
                message: 'validation error',
                details: err.errors.map((e)=> e.message)
            });
        }
        next(err); 
    }

}