use crate::config::*;
use napi::Result;
use napi_derive::napi;

mod config;
mod stringtable;

/// Localizes a string based on the language set in the config file.
#[napi]
pub fn localize(id: String) -> Result<String> {
    let config = load_config()?;
    let language = config.language;
    let stringtable = load_stringtable()?;
    let value = stringtable.get(&id, &language);

    match value {
        Some(value) => Ok(value),
        None => Err(napi::Error::new(
            napi::Status::GenericFailure,
            "String not found",
        )),
    }
}
