
import pool from '../database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config.js';

// Función para agregar un nuevo usuario
async function addUser(User, Persona, roleId = null) {
  const user = await pool.connect();
  try {
    const { nombre_usuario, estado, contrasenia } = User;
    const { nombre, apellido, fecha_nacimiento, direccion, telefono } = Persona

    // Verificar si el usuario ya existe
    const existingUser = await user.query('SELECT * FROM usuario WHERE nombre_usuario = $1', [nombre_usuario]);
    if (existingUser.rows.length > 0) {
      throw new Error('El nombre de usuario ya está en uso.');
    }

    // Verificar si se proporcionó un roleId y si el rol existe
    if (roleId) {
      const roleExists = await user.query('SELECT id_rol FROM rol WHERE id_rol = $1', [roleId]);
      if (roleExists.rows.length === 0) {

        throw new Error('El rol seleccionado no está registrado.');
      }
    } else {
      // Si no se proporcionó un roleId, obtener el primer rol registrado
      const defaultRoleQueryResult = await user.query('SELECT id_rol FROM rol ORDER BY id_rol LIMIT 1');
      roleId = defaultRoleQueryResult.rows[0].id_rol;
    }

    // Encriptar la contraseña antes de almacenarla
    const hashedPassword = await bcrypt.hash(contrasenia, 10); // 10 es el número de rondas de encriptación
    // Iniciar una transacción
    await user.query('BEGIN');

    //insertar datos personales
    const personaInsertResult = await user.query('INSERT INTO persona(nombre, apellido, fecha_nacimiento, direccion, telefono) VALUES ($1, $2, $3, $4, $5) RETURNING id_persona', [nombre, apellido, fecha_nacimiento, direccion, telefono]);
    const personaId = personaInsertResult.rows[0].id_persona;
    // Insertar el nuevo usuario
    const userInsertResult = await user.query('INSERT INTO usuario(nombre_usuario, estado, contrasenia, persona_id) VALUES($1, $2, $3, $4) RETURNING *', [nombre_usuario, estado, hashedPassword, personaId]);
    const userId = userInsertResult.rows[0].id_usuario;

    // Commit la transacción
    await user.query('COMMIT');

    // Insertar la relación entre el usuario y el rol en la tabla usuario_rol
    const userRoleInsertResult = await user.query('INSERT INTO usuario_rol(id_usuario, id_rol) VALUES($1, $2) RETURNING *', [userId, roleId]);

    // Generar token JWT con el ID del usuario
    const token = jwt.sign({ id_usuario: userId }, config.SECRET, {
      expiresIn: 86400 // 24 horas
    });

    // Devolver el usuario y el token
    return { usuario: userInsertResult.rows[0], roleId, token };
  } finally {
    user.release();
  }
}


//Funcion para obtener todos los usuarios
async function getAllUsers() {
  const users = await pool.connect();
  try {
    const resultado = await users.query(`
    SELECT 
    u.*, 
    r.nombre AS rol, 
    p.nombre AS nombre_persona, 
    p.apellido AS apellido_persona, 
    p.fecha_nacimiento AS fecha_nacimiento_persona, 
    p.direccion AS direccion_persona, 
    p.telefono AS telefono_persona
  FROM 
    usuario u
    LEFT JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario
    LEFT JOIN rol r ON ur.id_rol = r.id_rol
    LEFT JOIN persona p ON u.persona_id = p.id_persona;
    `);
    return resultado.rows;
  } finally {
    users.release()
  }
}


// funcion para obtener un usuario por su ID
export const getUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const usuario = await pool.connect();
    const query = `
      SELECT 
        u.*, 
        r.nombre AS rol,
        p.nombre AS nombre_persona,
        p.apellido AS apellido_persona,
        p.fecha_nacimiento AS fecha_nacimiento_persona,
        p.direccion AS direccion_persona,
        p.telefono AS telefono_persona
      FROM 
        usuario u
        LEFT JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario
        LEFT JOIN rol r ON ur.id_rol = r.id_rol
        LEFT JOIN persona p ON u.persona_id = p.id_persona
      WHERE 
        u.id_usuario = $1
    `;
    const result = await usuario.query(query, [userId]);
    usuario.release();
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener el usuario por ID:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

//funcion para actualizar un usuario
export const updateUser = async (userId, updatedData) => {
  const { nombre_usuario, contrasenia, estado, roleId, persona } = updatedData;

  const usuario = await pool.connect();

  try {
    // Iniciar una transacción
    await usuario.query('BEGIN');

    // Actualizar datos de usuario si se proporcionan
    if (nombre_usuario || contrasenia || estado) {
      // Encriptar la nueva contraseña si se proporciona
      let hashedPassword = contrasenia;
      if (contrasenia) {
        hashedPassword = await bcrypt.hash(contrasenia, 10);
      }

      const userQuery = 'UPDATE usuario SET nombre_usuario = $1, contrasenia = $2, estado = $3 WHERE id_usuario = $4';
      await usuario.query(userQuery, [nombre_usuario, hashedPassword, estado, userId]);
    }

    // Actualizar rol del usuario si se proporciona roleId
    if (roleId) {
      const userRoleQuery = 'UPDATE usuario_rol SET id_rol = $1 WHERE id_usuario = $2';
      await usuario.query(userRoleQuery, [roleId, userId]);
    }

    // Actualizar datos de persona si se proporcionan
    if (persona) {
      const { nombre, apellido, fecha_nacimiento, direccion, telefono } = persona;
      const personaQuery = 'UPDATE persona SET nombre = $1, apellido = $2, fecha_nacimiento = $3, direccion = $4, telefono = $5 WHERE id_persona = (SELECT persona_id FROM usuario WHERE id_usuario = $6)';
      await usuario.query(personaQuery, [nombre, apellido, fecha_nacimiento, direccion, telefono, userId]);
    }

    // Commit la transacción
    await usuario.query('COMMIT');

    return true; // Éxito en la actualización
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);

    // Rollback en caso de error
    await usuario.query('ROLLBACK');
    throw error;
  } finally {
    usuario.release();
  }
};









// Exportar las funciones del modelo
export default { addUser, getAllUsers, getUserId, updateUser };