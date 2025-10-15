use crate::stringtable::StringTable;
use isolang::Language;
use napi::Status;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum LoadConfigError {
    #[error("Config file not found")]
    FileNotFound(#[from] std::io::Error),
    #[error("Failed to parse config")]
    ParseFailure(#[from] serde_json::Error),
    #[error("Unknown load config error")]
    Unknown,
}

impl From<LoadConfigError> for napi::Error {
    fn from(value: LoadConfigError) -> Self {
        napi::Error::new(Status::GenericFailure, value.to_string())
    }
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
pub struct Config {
    pub language: Language,
}

/// Reads settings.json from the Configs folder and returns a Config struct containing language
/// settings.
pub fn load_config() -> Result<Config, LoadConfigError> {
    let config_path = PathBuf::from("../../Configs/settings.json");
    let config_string = std::fs::read_to_string(config_path)?;
    let config: Config = serde_json::from_str(&config_string)?;
    Ok(config)
}

pub fn load_stringtable() -> Result<StringTable, LoadConfigError> {
    let stringtable_path = PathBuf::from("../../Configs/stringtable.json");
    let stringtable_string = std::fs::read_to_string(stringtable_path)?;
    let stringtable: StringTable = serde_json::from_str(&stringtable_string)?;
    Ok(stringtable)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_load_config() -> Result<(), LoadConfigError> {
        let res = load_config();
        match res {
            Ok(_) => Ok(()),
            Err(res) => Err(res),
        }
    }

    #[test]
    fn test_load_stringtable() -> Result<(), LoadConfigError> {
        let res = load_stringtable();
        match res {
            Ok(_) => Ok(()),
            Err(res) => Err(res),
        }
    }
}
