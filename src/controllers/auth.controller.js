//import User from '../models/User.Model.js';
import { signin } from '../models/auth.model.js' // Importar la función de autenticación


export const signIn = async (req, res) => {
  const { nombre_usuario, contrasenia } = req.body;

  try {
    // Verificar si el nombre de usuario y la contraseña están presentes
    if (!nombre_usuario || !contrasenia) {
      return res.status(400).json({ error: 'El nombre de usuario y la contraseña son requeridos.' });
    }

    // Llamar a la función de autenticación para verificar las credenciales
    const token = await signin(nombre_usuario, contrasenia);

    // Si las credenciales son válidas, devolver el token en la respuesta
    res.status(200).json({ token });
  } catch (error) {
    // Manejar los errores que puedan ocurrir durante la autenticación
    if (error.message === 'Usuario no encontrado' || error.message === 'Contraseña incorrecta') {
      return res.status(401).json({ error: error.message });
    } else if (error.message === 'Usuario inactivo') {
      return res.status(403).json({ error: error.message }); // 403 Forbidden para usuarios inactivos
    }
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}


