import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { Client } from 'pg';

const confirmationPhrase = 'CREATE FIRST SUPER_ADMIN IN PROD';

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} es obligatorio para este procedimiento.`);
  return value;
}

function promptSecret(label) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    throw new Error('La contraseña requiere una terminal interactiva para ocultar la entrada.');
  }

  return new Promise((resolve, reject) => {
    const wasRaw = stdin.isRaw;
    let value = '';

    const finish = (error) => {
      stdin.off('data', onData);
      stdin.setRawMode(wasRaw);
      stdin.pause();
      stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    };

    const onData = (chunk) => {
      for (const character of chunk.toString('utf8')) {
        if (character === '\u0003') {
          finish(new Error('Operación cancelada.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          finish();
          return;
        }
        if (character === '\u007f' || character === '\b') {
          value = Array.from(value).slice(0, -1).join('');
          continue;
        }
        if (/^[\x20-\x7e]$/.test(character)) value += character;
      }
    };

    stdout.write(label);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}

function validateAdmin(email, firstName, lastName, password) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('El correo del administrador no tiene un formato válido.');
  }
  if (!firstName || firstName.length > 100 || !lastName || lastName.length > 100) {
    throw new Error('Nombre y apellido son obligatorios y deben tener hasta 100 caracteres.');
  }
  if (Buffer.byteLength(password, 'utf8') > 72
    || password.length < 14
    || !/[A-Z]/.test(password)
    || !/[a-z]/.test(password)
    || !/\d/.test(password)
    || !/[^A-Za-z0-9]/.test(password)) {
    throw new Error('La contraseña debe tener 14–72 bytes, mayúscula, minúscula, número y símbolo.');
  }
}

async function assertBootstrapReady(client) {
  const database = await client.query('SELECT current_database() AS name');
  if (database.rows[0].name !== process.env.POSTGRES_DB) {
    throw new Error('La base conectada no coincide con POSTGRES_DB.');
  }

  const migrations = await client.query(`
    SELECT 1 FROM public.schema_migrations WHERE version = '020' LIMIT 1
  `);
  if (migrations.rowCount !== 1) {
    throw new Error('No se encontró la migración 020. Ejecuta primero el bootstrap de producción.');
  }

  const admins = await client.query(`
    SELECT 1 FROM public.users WHERE role = 'SUPER_ADMIN' LIMIT 1
  `);
  if (admins.rowCount) {
    throw new Error('Ya existe un usuario SUPER_ADMIN. El bootstrap inicial es de un solo uso.');
  }
}

async function main() {
  if (process.env.DOMMIA_BOOTSTRAP_TARGET !== 'PRODUCTION') {
    throw new Error('Define DOMMIA_BOOTSTRAP_TARGET=PRODUCTION solo en la sesión controlada de PROD.');
  }

  const connection = {
    host: requiredEnvironment('POSTGRES_HOST'),
    port: Number.parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: requiredEnvironment('POSTGRES_USER'),
    password: requiredEnvironment('POSTGRES_PASSWORD'),
    database: requiredEnvironment('POSTGRES_DB'),
    application_name: 'dommia-first-super-admin-bootstrap',
  };
  if (!Number.isInteger(connection.port) || connection.port < 1 || connection.port > 65535) {
    throw new Error('POSTGRES_PORT no es válido.');
  }

  const client = new Client(connection);
  let password = '';
  let transactionOpen = false;

  try {
    await client.connect();
    await assertBootstrapReady(client);

    const prompt = createInterface({ input: stdin, output: stdout });
    const confirmation = await prompt.question(`Escribe exactamente "${confirmationPhrase}" para continuar: `);
    if (confirmation !== confirmationPhrase) throw new Error('Confirmación incorrecta. No se creó ningún usuario.');
    const email = (await prompt.question('Correo del primer SUPER_ADMIN: ')).trim().toLowerCase();
    const firstName = (await prompt.question('Nombre: ')).trim();
    const lastName = (await prompt.question('Apellido: ')).trim();
    prompt.close();

    password = await promptSecret('Contraseña inicial (entrada oculta): ');
    const passwordConfirmation = await promptSecret('Confirma la contraseña: ');
    if (password !== passwordConfirmation) throw new Error('Las contraseñas no coinciden.');
    validateAdmin(email, firstName, lastName, password);

    await client.query('BEGIN');
    transactionOpen = true;
    await client.query("SELECT pg_advisory_xact_lock(hashtext('dommia:first-super-admin'))");
    await assertBootstrapReady(client);

    const existingEmail = await client.query(
      'SELECT 1 FROM public.users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [email],
    );
    if (existingEmail.rowCount) throw new Error('Ese correo ya pertenece a una cuenta. No se modificó ningún usuario.');

    const created = await client.query(`
      INSERT INTO public.users (email, password_hash, first_name, last_name, role, is_active)
      VALUES ($1, crypt($2, gen_salt('bf', 12)), $3, $4, 'SUPER_ADMIN', TRUE)
      RETURNING id, email
    `, [email, password, firstName, lastName]);

    await client.query('COMMIT');
    transactionOpen = false;
    password = '';
    console.log(`SUPER_ADMIN inicial creado. ID: ${created.rows[0].id}. Correo: ${created.rows[0].email}.`);
    console.log('La contraseña no se guardó en el repositorio ni se mostró en pantalla.');
  } catch (error) {
    password = '';
    if (transactionOpen) await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`No se creó el SUPER_ADMIN inicial: ${error instanceof Error ? error.message : 'error desconocido'}`);
  process.exitCode = 1;
});