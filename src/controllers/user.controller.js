
import User from '../models/User.Model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { getUserId } from '../models/User.Model.js';
import { updateUser } from '../models/User.Model.js';


export const createUser = async (req, res) => {
  const { nombre_usuario, contrasenia, fecha_registro,  estado, roleId } = req.body;

  // Verificar si algún campo requerido está vacío
  if (!nombre_usuario || !contrasenia ) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  try {
    const userSave = await User.addUser({ nombre_usuario, contrasenia, fecha_registro,  estado }, roleId);
    res.status(201).json(userSave);
    
  } catch (error) {
    if (error.message === 'El nombre de usuario ya está en uso.') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}


//funcion para obtener todos los usuarios
export const getUsers = async (req, res) => {
    try{
       const users = await User.getAllUsers();

       res.status(200).json(users)
    } catch(error){
      console.error('Erro al obtener usuarios:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
}

//funcion para obtener un usuario en especifico
export const getUserById = async (req, res) => {
    try {
      const usuario = await getUserId(req, res);
      res.status(200).json(usuario)
    } catch (error){
      console.error('Error al obtener el usuario por ID:', error);
      res.status(500).json({ error: 'Error interno del seervidor' });
    }
}
//funcion para actulizar el usuario

export const updateUserById = async(req, res) => {
  const userId = req.params.userId;
  const { nombre_usuario, contrasenia,  estado } = req.body; // Modifica para que incluya la nueva contraseña

  try {
    const updated = await updateUser(userId, { nombre_usuario, contrasenia,  estado });
    if (!updated) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.status(200).json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
   
  
}
export const deleteUserById = (req, res) => {
    
}