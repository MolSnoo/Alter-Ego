use language_tags::LanguageTag;
use napi::Status;
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{Error, ErrorKind};
use std::path::{Path, PathBuf};
use std::str::FromStr;
use thiserror::Error;

/// Error type for loading config files.
#[derive(Error, Debug)]
pub enum LoadConfigError {
    #[error(transparent)]
    FileNotFound(#[from] std::io::Error),
    #[error(transparent)]
    ParseFailure(#[from] serde_json::Error),
    #[error("Unknown load config error")]
    Unknown,
}

impl From<LoadConfigError> for napi::Error {
    fn from(value: LoadConfigError) -> Self {
        napi::Error::new(Status::GenericFailure, value.to_string())
    }
}

/// Struct representing the "language" key in settings.json.
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
pub struct Settings {
    pub language: LanguageTag,
}

/// Struct representing the data in the stringtable.json file.
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
pub struct StringTable {
    #[serde(flatten)]
    pub map: HashMap<String, HashMap<LanguageTag, String>>,
}

impl StringTable {
    /// Creates a new StringTable from a HashMap.
    #[allow(dead_code)]
    pub fn new(map: &HashMap<String, HashMap<LanguageTag, String>>) -> Self {
        Self { map: map.clone() }
    }
}

impl StringTable {
    /// Returns a localized string for the given id and language.
    pub fn get(&self, id: &str, language: &LanguageTag) -> Option<String> {
        let entry = self.map.get(id);
        let lang_eng = LanguageTag::from_str("en").unwrap();
        match entry {
            Some(entry) => match entry.get(language) {
                None => entry.get(&lang_eng).cloned(),
                Some(value) => Some(value.clone()),
            },
            None => None,
        }
    }
}

// Reads a config file from the Configs folder and returns a deserialized struct.
pub fn load_config<T: DeserializeOwned>(file_name: &str) -> Result<T, LoadConfigError> {
    let config_path = get_config_path_root()?.join(file_name);
    let config_string = std::fs::read_to_string(config_path)?;
    let config: T = serde_json::from_str(&config_string)?;
    Ok(config)
}

/// Returns the path to the Configs folder.
fn get_config_path_root() -> Result<PathBuf, Error> {
    let base_path = Path::new("Configs");
    if base_path.exists() {
        Ok(base_path.to_path_buf())
    } else {
        let base_path = Path::new("../../Configs");
        if base_path.exists() {
            Ok(base_path.to_path_buf())
        } else {
            Err(Error::new(
                ErrorKind::NotADirectory,
                "Configs folder not found",
            ))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::str::FromStr;

    #[test]
    fn test_load_settings() -> Result<(), LoadConfigError> {
        let res = load_config::<Settings>("settings.json");
        match res {
            Ok(_) => Ok(()),
            Err(res) => Err(res),
        }
    }

    #[test]
    fn test_load_stringtable() -> Result<(), LoadConfigError> {
        let res = load_config::<StringTable>("stringtable.json");
        match res {
            Ok(_) => Ok(()),
            Err(res) => Err(res),
        }
    }

    #[test]
    fn test_load_config_invalid_filename() {
        let res = load_config::<StringTable>("invalid_stringtable.json");
        assert!(res.is_err());
        let res = load_config::<Settings>("invalid_setting.json");
        assert!(res.is_err());
    }

    #[test]
    fn test_stringtable_from_json() {
        let test_json = json!({
            "string1": {
                "en": "hello",
                "fr": "bonjour",
                "zh-CN": "你好"
            },
            "string2": {
                "en": "world",
                "fr": "monde",
                "zh-CN": "世界"
            },
            "string3": {}
        });

        let stringtable: StringTable = serde_json::from_value(test_json).unwrap();

        assert_eq!(
            stringtable.get("string1", &LanguageTag::from_str("en").unwrap()),
            Some("hello".to_string())
        );
        assert_eq!(
            stringtable.get("string1", &LanguageTag::from_str("fr").unwrap()),
            Some("bonjour".to_string())
        );
        assert_eq!(
            stringtable.get("string1", &LanguageTag::from_str("de").unwrap()),
            Some("hello".to_string())
        );
        assert_eq!(
            stringtable.get("string3", &LanguageTag::from_str("de").unwrap()),
            None
        );
        assert_eq!(
            stringtable.get("string2", &LanguageTag::from_str("zh-CN").unwrap()),
            Some("世界".to_string())
        );
    }

    #[test]
    fn test_stringtable_get() {
        let mut map: HashMap<String, HashMap<LanguageTag, String>> = HashMap::new();
        let mut value1: HashMap<LanguageTag, String> = HashMap::new();

        value1.insert(LanguageTag::from_str("en").unwrap(), "hello".to_string());
        value1.insert(LanguageTag::from_str("fr").unwrap(), "bonjour".to_string());
        map.insert("string1".to_string(), value1);
        map.insert("string2".to_string(), HashMap::new());

        let stringtable = StringTable::new(&map);

        assert_eq!(
            stringtable.get("string1", &LanguageTag::from_str("en").unwrap()),
            Some("hello".to_string())
        );
        assert_eq!(
            stringtable.get("string1", &LanguageTag::from_str("fr").unwrap()),
            Some("bonjour".to_string())
        );
        assert_eq!(
            stringtable.get("string2", &LanguageTag::from_str("en").unwrap()),
            None
        );
        assert_eq!(
            stringtable.get("string1", &LanguageTag::from_str("de").unwrap()),
            Some("hello".to_string())
        );
    }
}
