export const asyncAjax = (jqXHR) =>
  new Promise((resolve, reject) => {
    jqXHR.done((data) => resolve(data));
    jqXHR.fail((_self, _textStatus, error) => reject(error));
  });
