import api from './client';

// Auth
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');

// Dashboard
export const getDashboard = () => api.get('/dashboard');
export const getMetrics = () => api.get('/metrics');
export const seedMetrics = () => api.post('/metrics/seed');

// Students
export const getStudents = (params) => api.get('/students', { params });
export const searchStudents = (q) => api.get('/students/search', { params: { q } });
export const getStudent = (id) => api.get(`/students/${id}`);
export const createStudent = (data) => api.post('/students', data);
export const updateStudent = (id, data) => api.put(`/students/${id}`, data);
export const deleteStudent = (id) => api.delete(`/students/${id}`);

// Subjects
export const getSubjects = () => api.get('/subjects');
export const getMySubjects = () => api.get('/subjects/my');
export const getSubject = (id) => api.get(`/subjects/${id}`);
export const createSubject = (data) => api.post('/subjects', data);
export const updateSubject = (id, data) => api.put(`/subjects/${id}`, data);
export const deleteSubject = (id) => api.delete(`/subjects/${id}`);
export const assignFacultySubject = (data) => api.post('/subjects/assignments/assign', data);
export const removeAssignment = (assignmentId) => api.delete(`/subjects/assignments/${assignmentId}`);
export const getFacultyAssignments = (facultyId) => api.get(`/subjects/assignments/faculty/${facultyId}`);

// Departments
export const getDepartments = () => api.get('/departments');
export const createDepartment = (data) => api.post('/departments', data);
export const deleteDepartment = (id) => api.delete(`/departments/${id}`);

// Marks
export const getMarks = (params) => api.get('/marks', { params });
export const getMark = (id) => api.get(`/marks/${id}`);
export const createMark = (data) => api.post('/marks', data);
export const updateMark = (id, data) => api.put(`/marks/${id}`, data);
export const deleteMark = (id) => api.delete(`/marks/${id}`);

// Report Cards
export const getStudentReportCards = (studentId) => api.get(`/report-cards/student/${studentId}`);
export const getFullReportCard = (studentId, semester) => api.get(`/report-cards/${studentId}/${semester}/full`);
export const publishReportCard = (studentId, semester) => api.post(`/report-cards/${studentId}/publish`, { semester });
export const unpublishReportCard = (studentId, semester) => api.post(`/report-cards/${studentId}/unpublish`, { semester });

// Bulk Import
export const bulkImportCSV = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/import/csv', form, { headers: { 'Content-Type': 'multipart/form-data' } });
};
