type Role = 'admin' | 'lecturer' | 'student';

const schemasFields = {
  loginSchema: ['role', 'regNo', 'password'],
  registrationSchema: {
    admin: ['role', 'regNo', 'nationalId', 'fullNames', 'password'],
    lecturer: ['role', 'regNo', 'password', 'nationalId', 'fullNames', 'courseCode'],
    student: ['role', 'regNo', 'password', 'nationalId', 'fullNames', 'courseCode', 'year'],
  },
  courseSchema: ['courseCode', 'courseTitle', 'courseLevel'],
  unitSchema: ['courseCode', 'unitCode', 'unitTitle', 'unitYear'],
  pleaSchema: ['regNo', 'courseCode', 'unitCode', 'reason', 'scheduledDate', 'scheduledTime'],
  tempoSchema: ['courseCode', 'unitCode', 'scheduledDate', 'scheduledTime'],
  notesSchema: ['courseCode', 'unitCode'],
  blockSchema: ['regNo', 'action'],
  pleaStatusSchema: ['id', 'action'],
  deleteSchema: ['regNo'],
  commonSchema: ['courseCode'],
  deletePleaSchema: ['_id'],
  deleteNoteSchema: ['unitCode'],
  deleteTempoSchema: ['unitCode'],
  deleteUnitSchema: ['unitCode'],
  qrSchema: ['courseCode', 'unitCode', 'lecturer', 'date', 'time']
};

const checkKeysExist = (obj: any, keys: string[], schemaName = '') => {
  if (!obj || typeof obj !== 'object') throw new Error(`${schemaName} data must be an object`);

  for (const key of keys) {
    if (
      obj[key] === undefined ||
      obj[key] === null ||
      (typeof obj[key] === 'string' && obj[key].trim() === '')
    ) {
      throw new Error(`${key} is required${schemaName ? ` for ${schemaName}` : ''}`);
    }
  }
};

const pickKeys = (obj: any, keys: string[]) =>
  keys.reduce((acc, key) => {
    acc[key] = obj[key];
    return acc;
  }, {} as Record<string, any>);

export const validateData = (schemaName: keyof typeof schemasFields, data: any) => {

  if (data && typeof data === 'object' && 'data' in data && typeof data.data === 'object') {
    data = { ...data, ...data.data };
    delete data.data;
  }

  let keys: string[];

  if (schemaName === 'registrationSchema') {
    const role = (data.role || '').toLowerCase() as Role;
    if (!role) throw new Error('Role is required for registrationSchemas validation');

    const regKeys = schemasFields.registrationSchema[role];
    if (!regKeys) throw new Error(`Unsupported registration role: ${role}`);

    keys = regKeys;
  } else {
    keys = schemasFields[schemaName] as string[];
    if (!keys) throw new Error(`Unsupported schema: ${schemaName}`);
  }

  checkKeysExist(data, keys, schemaName);

  return pickKeys(data, keys);
};