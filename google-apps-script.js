/*
 * =====================================================
 * ІНСТРУКЦІЯ З НАЛАШТУВАННЯ GOOGLE APPS SCRIPT
 * =====================================================
 * 
 * 1. Відкрийте вашу Google Таблицю
 * 2. Перейдіть: Розширення → Apps Script
 * 3. Видаліть весь код у редакторі
 * 4. Скопіюйте весь код нижче та вставте його
 * 5. Натисніть "Зберегти" (іконка дискети)
 * 6. Натисніть "Розгорнути" → "Нове розгортання"
 * 7. Тип: "Веб-додаток"
 * 8. Виконувати як: "Я"
 * 9. Хто має доступ: "Будь-хто"
 * 10. Натисніть "Розгорнути"
 * 11. Скопіюйте URL веб-додатку (потрібен для admin.html)
 * 
 * ВАЖЛИВО: Після першого розгортання надайте доступ до Google Drive!
 * 
 * СТРУКТУРА ТАБЛИЦІ (перший аркуш):
 * Колонка A: key (назва поля)
 * Колонка B: value (значення)
 * 
 * Рядки:
 * 1: hero_title | Безпечне Місто
 * 2: hero_subtitle | Дніпро
 * 3: hero_description | Комплексна система...
 * 4: hero_image | (URL зображення з Google Drive)
 * 5: stat_cameras | 2 886+
 * 6: stat_requests | 2 400+
 * 7: stat_storage | 30 днів
 * 8: stat_monitoring | 24/7
 * 9: telegram_link | https://t.me/SaveCityDnipro_bot
 * 10: form_individual_link | https://forms.gle/LqgvbhWfQq6xLwfz7
 * 11: form_legal_link | https://forms.gle/EAz4ziGbij3UTUab8
 * 12: about_title | Про програму
 * 13: about_description | Програма "Безпечне місто"...
 * 
 * =====================================================
 */

// Назва папки для зберігання зображень
var IMAGES_FOLDER_NAME = "Безпечне Місто - Зображення";

// Отримати або створити папку для зображень
function getOrCreateImagesFolder() {
  var folders = DriveApp.getFoldersByName(IMAGES_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(IMAGES_FOLDER_NAME);
}

// Обробка GET запитів (читання даних)
function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    
    var result = {};
    for (var i = 0; i < data.length; i++) {
      var key = data[i][0];
      var value = data[i][1];
      if (key && key.toString().trim() !== '') {
        result[key.toString().trim()] = value ? value.toString() : '';
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Обробка POST запитів (збереження даних та завантаження зображень)
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    // Перевіряємо, чи це запит на завантаження зображення
    if (data.action === 'uploadImage') {
      return uploadImage(data);
    }
    
    // Звичайне збереження даних
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Очищуємо аркуш
    sheet.clear();
    
    // Записуємо дані
    var keys = Object.keys(data);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var value = data[key];
      sheet.getRange(i + 1, 1).setValue(key);
      sheet.getRange(i + 1, 2).setValue(value);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Дані збережено успішно!' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Функція завантаження зображення на Google Drive
function uploadImage(data) {
  try {
    var folder = getOrCreateImagesFolder();
    
    // Декодуємо base64 зображення
    var base64Data = data.imageData;
    var mimeType = data.mimeType || 'image/jpeg';
    var fileName = data.fileName || 'hero-image-' + new Date().getTime() + '.jpg';
    
    // Видаляємо prefix "data:image/...;base64," якщо є
    if (base64Data.indexOf(',') > -1) {
      base64Data = base64Data.split(',')[1];
    }
    
    // Створюємо blob з base64
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
    
    // Видаляємо старі зображення hero (опціонально, щоб не засмічувати Drive)
    var existingFiles = folder.getFilesByName(fileName);
    while (existingFiles.hasNext()) {
      existingFiles.next().setTrashed(true);
    }
    
    // Завантажуємо файл
    var file = folder.createFile(blob);
    
    // Встановлюємо публічний доступ для перегляду
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Отримуємо ID файлу
    var fileId = file.getId();
    
    // Створюємо URL для відображення
    var viewUrl = 'https://drive.google.com/uc?export=view&id=' + fileId;
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        imageUrl: viewUrl,
        fileId: fileId,
        message: 'Зображення завантажено успішно!' 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
