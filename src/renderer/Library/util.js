import { OctoPrintApi } from './OctoPrintApi';
import { Method } from './IpcConnector';

export async function checkConnection(baseurl, apikey) {
  const api = new OctoPrintApi(baseurl, apikey);

  try {
    await api.fetchWithAuth(Method.GET, 'api/job');
    return undefined;
  } catch (error) {
    return error;
  }
}
