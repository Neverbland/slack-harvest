
# create deployment dirs
directory "/var/www" do
    owner "www-data"
    group "www-data"
    mode 0775
    action :create
    not_if do
        Dir.exists?("/var/www")
    end
end

directory "/var/www/sh-middleman" do
    owner "slack-harvest-middleman"
    group "www-data"
    mode 0755
    action :create
    not_if do
        Dir.exists?("/var/www/sh-middleman")
    end
end

# build frontend application config
template "config.json" do
    path "/var/www/sh-middleman/config.json"
    source "config.json.erb"
    owner "slack-harvest-middleman"
    group "www-data"
    mode 0644
    variables(
        :node => node
    )
end