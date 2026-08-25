export const registerLearner = async(req, res)=>{
    try {
        
        res.json({
            success: true,
            msg:"Registered ✅",
        })
    } catch (error) {
        res.json({
            success: false,
            ERR: error.message
        })
    }
}
export const loginLearner = async(req, res)=>{
    try {
        
        res.json({
            success: true,
            msg:"LoggedIn ✅",
        })
    } catch (error) {
        res.json({
            success: false,
            ERR: error.message
        })
    }
}
export const googleAuthLearner = async(req, res)=>{
    try {
        
        res.json({
            success: true,
            msg:"googleAuth signed ✅",
        })
    } catch (error) {
        res.json({
            success: false,
            ERR: error.message
        })
    }
};
export const logoutLearner = async(req, res)=>{
    try {
        
        res.json({
            success: true,
            msg:"Logged Out ✅",
        })
    } catch (error) {
        res.json({
            success: false,
            ERR: error.message
        })
    }
};
