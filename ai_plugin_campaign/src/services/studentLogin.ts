import type { StudentLoginPayload } from '../types';
import { addAiEduStudent } from './aiEduApi';
import { saveStudent } from './campaignStorage';

interface StudentLoginDependencies {
  addStudent?: typeof addAiEduStudent;
  saveLocalStudent?: typeof saveStudent;
}

/** 服务端确认成功后，才允许把学生信息写入本地存储。 */
export async function submitStudentLogin(
  payload: StudentLoginPayload,
  dependencies: StudentLoginDependencies = {},
) {
  await (dependencies.addStudent ?? addAiEduStudent)(payload);
  return (dependencies.saveLocalStudent ?? saveStudent)(payload, { allowExisting: true });
}
