use crate::config::*;
use crate::format::*;
use napi::Result;
use napi_derive::napi;

mod config;
mod format;

/// Localizes a string based on the language set in the config file.
#[napi]
pub fn localize(id: String) -> Result<String> {
    let config: Settings = load_config("settings.json")?;
    let language = config.language;
    let stringtable: StringTable = load_config("stringtable.json")?;
    let value = stringtable.get(&id, &language);

    match value {
        Some(value) => Ok(value),
        None => Err(napi::Error::new(
            napi::Status::GenericFailure,
            "String not found",
        )),
    }
}

/// Localizes a string based on the language set in the config file and formats it with arguments.
#[napi]
pub fn localize_format(id: String, args: Vec<String>) -> Result<String> {
    let preformat = localize(id)?;
    let res = format(&preformat, &args);
    Ok(res)
}
