<?php
/**
 * @link              https://www.mattbev.com
 * @since             1.0.0
 * @package           Wcw_Alt_Tag_Audit
 *
 * @wordpress-plugin
 * Plugin Name:       Alt Attribute Audit
 * Plugin URI:        https://www.whalingcityweb.com/alt-tag-audit
 * Description:       Displays a list of images in the media library without alt text, and an admin message reminding you to add it.
 * Version:           1.0.0
 * Author:            Matt Bevilacqua
 * Author URI:        https://www.mattbev.com
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       wcw-alt-tag-audit
 * Domain Path:       /languages
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Currently plugin version.
 * Start at version 1.0.0 and use SemVer - https://semver.org
 * Rename this for your plugin and update it as you release new versions.
 */
define( 'WCW_ALT_TAG_AUDIT_VERSION', '1.0.0' );

/**
 * The code that runs during plugin activation.
 * This action is documented in includes/class-wcw-alt-tag-audit-activator.php
 */
function activate_wcw_alt_tag_audit() {
	require_once plugin_dir_path( __FILE__ ) . 'includes/class-wcw-alt-tag-audit-activator.php';
	Wcw_Alt_Tag_Audit_Activator::activate();
}

/**
 * The code that runs during plugin deactivation.
 * This action is documented in includes/class-wcw-alt-tag-audit-deactivator.php
 */
function deactivate_wcw_alt_tag_audit() {
	require_once plugin_dir_path( __FILE__ ) . 'includes/class-wcw-alt-tag-audit-deactivator.php';
	Wcw_Alt_Tag_Audit_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'activate_wcw_alt_tag_audit' );
register_deactivation_hook( __FILE__, 'deactivate_wcw_alt_tag_audit' );

/**
 * The core plugin class that is used to define internationalization,
 * admin-specific hooks, and public-facing site hooks.
 */
require plugin_dir_path( __FILE__ ) . 'includes/class-wcw-alt-tag-audit.php';

/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file does
 * not affect the page life cycle.
 *
 * @since    1.0.0
 */
function run_wcw_alt_tag_audit() {

	$plugin = new Wcw_Alt_Tag_Audit();
	$plugin->run();

}
run_wcw_alt_tag_audit();
