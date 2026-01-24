//! UI scraping utilities for extracting text from applications

use crate::accessibility::*;
use cidre::arc::R;
use cidre::ax;
use std::collections::HashSet;

/// A scraped text item with metadata
#[derive(Debug, Clone)]
pub struct ScrapedItem {
    pub text: String,
    pub role: String,
    pub role_desc: Option<String>,
}

/// Scrape all text content from a UI element tree
pub fn scrape_text(root: &ax::UiElement, max_depth: usize) -> Vec<ScrapedItem> {
    let mut items = Vec::new();
    scrape_recursive(root, max_depth, 0, &mut items);
    items
}

fn scrape_recursive(
    element: &ax::UiElement,
    max_depth: usize,
    current_depth: usize,
    items: &mut Vec<ScrapedItem>,
) {
    if current_depth > max_depth {
        return;
    }

    let role = get_role(element).unwrap_or_else(|| "Unknown".to_string());
    let role_desc = get_role_desc(element);

    // Try to get text content from various attributes
    for text in [get_value(element), get_title(element), get_description(element)]
        .into_iter()
        .flatten()
    {
        if !text.is_empty() && text.len() > 2 {
            items.push(ScrapedItem {
                text,
                role: role.clone(),
                role_desc: role_desc.clone(),
            });
        }
    }

    // Recurse into children
    for child in get_children(element) {
        scrape_recursive(&child, max_depth, current_depth + 1, items);
    }
}

/// Scrape and deduplicate text content
pub fn scrape_unique_text(root: &ax::UiElement, max_depth: usize) -> Vec<ScrapedItem> {
    let items = scrape_text(root, max_depth);
    let mut seen = HashSet::new();
    items
        .into_iter()
        .filter(|item| seen.insert(item.text.clone()))
        .collect()
}

/// Scrape text content as simple strings
pub fn scrape_strings(root: &ax::UiElement, max_depth: usize) -> Vec<String> {
    scrape_text(root, max_depth)
        .into_iter()
        .map(|item| item.text)
        .collect()
}

/// Scrape unique strings
pub fn scrape_unique_strings(root: &ax::UiElement, max_depth: usize) -> Vec<String> {
    let mut seen = HashSet::new();
    scrape_strings(root, max_depth)
        .into_iter()
        .filter(|s| seen.insert(s.clone()))
        .collect()
}

/// Filter scraped items by role
pub fn filter_by_role(items: Vec<ScrapedItem>, roles: &[&str]) -> Vec<ScrapedItem> {
    items
        .into_iter()
        .filter(|item| roles.iter().any(|r| item.role.contains(r)))
        .collect()
}

/// Filter scraped items containing specific text
pub fn filter_by_text(items: Vec<ScrapedItem>, pattern: &str) -> Vec<ScrapedItem> {
    let pattern_lower = pattern.to_lowercase();
    items
        .into_iter()
        .filter(|item| item.text.to_lowercase().contains(&pattern_lower))
        .collect()
}

/// Scrape with scrolling to get more content
pub fn scrape_with_scroll<F>(
    app_name: &str,
    get_root: F,
    scroll_iterations: u32,
    max_depth: usize,
) -> anyhow::Result<Vec<ScrapedItem>>
where
    F: Fn() -> anyhow::Result<R<ax::UiElement>>,
{
    use crate::input::scroll_up_in_app;
    use std::thread;
    use std::time::Duration;

    let mut all_items = Vec::new();
    let mut seen_text = HashSet::new();

    for i in 0..=scroll_iterations {
        if i > 0 {
            scroll_up_in_app(app_name, 5, 500)?;
            thread::sleep(Duration::from_millis(800));
        }

        let root = get_root()?;
        let items = scrape_text(&root, max_depth);

        let mut new_count = 0;
        for item in items {
            if !seen_text.contains(&item.text) {
                seen_text.insert(item.text.clone());
                all_items.push(item);
                new_count += 1;
            }
        }

        // Stop if no new items found
        if i > 0 && new_count == 0 {
            break;
        }
    }

    Ok(all_items)
}
