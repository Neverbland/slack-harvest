# build slack-harvest-middleman application config
template "config.json" do
    path "/var/www/sh-middleman/config.json"
    source "config.json.erb"
    mode 0644
    variables(
        :node => node
    )
end