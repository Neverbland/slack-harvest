# -*- mode: ruby -*-
# vi: set ft=ruby :

VAGRANTFILE_API_VERSION = "2"
VAGRANT_HOST="192.168.10.12"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
    config.berkshelf.enabled = true

    # install debian
    config.vm.box = "debian7.2-slack-harvest-middleman"
    config.vm.box_url = "http://nbcdn.io/debian-7.2.0-amd64.box"

    # configure network
    config.vm.hostname = "slack-harvest-middleman.neverbland.dev"
    config.vm.network "private_network", ip: VAGRANT_HOST, network: "255.255.0.0."

    config.vm.synced_folder ".", "/var/www/sh-middleman", :nfs => true

    # VirtualBox specific config
    config.vm.provider :virtualbox do |vb, override|
        override.vm.synced_folder ".", "/var/www/sh-middleman", :nfs => true
        vb.customize ["modifyvm", :id, "--rtcuseutc", "on"]
        vb.customize ["modifyvm", :id, "--memory", 2048]
        vb.customize ["modifyvm", :id, "--cpus", 2]
    end

    # manage /etc/hosts file
    config.hostmanager.enabled = true
    config.hostmanager.manage_host = true
    config.hostmanager.ignore_private_ip = false
    config.hostmanager.include_offline = true
    config.hostmanager.aliases = [
        "slack-harvest-middleman.dev", "www.slack-harvest-middleman.dev", "sh.dev"
    ]

    # fixed chef version to be sure that recipes are working
    config.omnibus.chef_version = "11.10.0"

    # enable caching in host machine
    config.cache.auto_detect = true
    config.cache.enable :apt
    config.cache.enable :chef
    config.cache.scope = :machine

    # chef recipes
    config.vm.provision "chef_solo" do |chef|
        chef.cookbooks_path = ["./build/chef/cookbooks"]
        chef.roles_path = "./build/chef/roles"
        chef.add_role "slack-harvest-middleman"
        chef.json = {
            "nodejs" => {
                "install_method" => "source",
                "version" => "0.10.26"
            },
            "nginx" => {
                "server_names_hash_bucket_size" => 128,
                "version" => "1.2.1"
            },
            "mysql" => {
                "server_root_password" => "root",
                "server_repl_password" => "root",
                "server_debian_password" => "root"
            },
            "application" => {
                "root_dir" => "/var/www/sh-middleman",
                "app" => {
                    "hostname" => "sh.dev",
                    "ip" => VAGRANT_HOST,
                    "port" => 3000
                },
                "mysql" => {
                    "database" => "sh_middleman",
                    "username" => "root",
                    "plainPassword" => "root"
                }
            }
        }
    end

    # also run hostmanager after all provisioning has happened
    config.vm.provision :hostmanager

end