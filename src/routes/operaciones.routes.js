import { Router } from "express";

const router = Router()

import * as operacionesCtrl from '../controllers/operaciones.controller.js'//importa todos mis controladores de la ruta producto
import { verifyToken, verifyAdmin, verifyEmpleado } from "../middlewares/auth.jwt.js";


router.post('/',operacionesCtrl.createOperaciones)
router.get('/', operacionesCtrl.getOperaciones)
router.get('/:operacionesId', operacionesCtrl.getOperacionesById)
router.put('/:operacionesId', operacionesCtrl.updateOperacionesById)
router.delete('/:operacionesId', operacionesCtrl.deleteOperacionesById)



export default router;