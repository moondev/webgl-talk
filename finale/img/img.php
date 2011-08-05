<?php

$type = 'image/jpeg';
header('Content-Type:'.$type);

$img = file_get_contents('https://api.twitter.com/1/users/profile_image/' . $_GET['t'] . '?size=original');

echo $img;

?>